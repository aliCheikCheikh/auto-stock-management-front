import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ProblemDetail } from '../../../../core/api/problem-detail.model';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { SessionContextService } from '../../../../core/session/session-context.service';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { Spinner } from '../../../../shared/ui/spinner/spinner';
import { StockReceiptsApiService } from '../../data-access/stock-receipts-api.service';
import {
  StockReceiptImportExecutionReport,
  StockReceiptImportPreview,
  StockReceiptImportRowAction,
  StockReceiptImportRowExecutionResult,
  StockReceiptImportRowExecutionStatus,
  StockReceiptImportRowPreview,
} from '../../models/stock-receipt-import.model';

const MAX_FILE_SIZE_BYTES = 1024 * 1024;

@Component({
  selector: 'app-stock-receipt-import',
  imports: [ConfirmDialog, Spinner],
  templateUrl: './stock-receipt-import.html',
  styleUrl: './stock-receipt-import.scss',
})
export class StockReceiptImport {
  private readonly api = inject(StockReceiptsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly notifications = inject(NotificationService);
  private readonly sessionContext = inject(SessionContextService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly selectedFile = signal<File | null>(null);
  readonly preview = signal<StockReceiptImportPreview | null>(null);
  readonly report = signal<StockReceiptImportExecutionReport | null>(null);
  readonly selectedLineNumbers = signal<ReadonlySet<number>>(new Set());
  readonly errorMessage = signal('');
  readonly isAnalyzing = signal(false);
  readonly isDownloadingTemplate = signal(false);
  readonly isImporting = signal(false);
  readonly showConfirmation = signal(false);
  readonly safetyLockChange = output<boolean>();

  private readonly executionId = signal<string | null>(null);

  readonly validRows = computed(() =>
    this.preview()?.rows.filter((row) => row.action !== 'REJECT') ?? [],
  );
  readonly selectedRows = computed(() => {
    const selected = this.selectedLineNumbers();
    return this.validRows().filter((row) => selected.has(row.lineNumber));
  });
  readonly selectedQuantity = computed(() =>
    this.selectedRows().reduce((total, row) => total + this.quantity(row), 0),
  );
  readonly allValidRowsSelected = computed(
    () =>
      this.validRows().length > 0 &&
      this.validRows().every((row) => this.selectedLineNumbers().has(row.lineNumber)),
  );
  readonly selectionLocked = computed(() => this.executionId() !== null);
  readonly confirmationMessage = computed(() => {
    const rows = this.selectedRows();
    const creations = rows.filter((row) => row.action === 'CREATE_PRODUCT').length;
    const receipts = rows.length - creations;
    return `${rows.length} ligne(s) seront importées : ${creations} nouveau(x) produit(s) et ${receipts} produit(s) existant(s). Cette opération modifiera le stock.`;
  });

  constructor() {
    this.sessionContext
      .ensureLoaded()
      .pipe(takeUntilDestroyed())
      .subscribe({
        error: () => this.errorMessage.set('Impossible de charger le contexte du magasin.'),
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    this.clearPreparedImport();

    if (!file) {
      this.selectedFile.set(null);
      return;
    }
    if (!file.name.toLocaleLowerCase('fr').endsWith('.csv')) {
      this.selectedFile.set(null);
      this.errorMessage.set('Choisissez un fichier au format CSV (.csv).');
      input.value = '';
      return;
    }
    if (file.size === 0) {
      this.selectedFile.set(null);
      this.errorMessage.set('Le fichier choisi est vide.');
      input.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.selectedFile.set(null);
      this.errorMessage.set('Le fichier dépasse la taille maximale autorisée de 1 Mo.');
      input.value = '';
      return;
    }

    this.selectedFile.set(file);
  }

  analyze(): void {
    const file = this.selectedFile();
    const context = this.sessionContext.context();
    if (!file || !context || this.isAnalyzing()) {
      if (!context) {
        this.errorMessage.set('Le magasin n’est pas encore prêt. Réessayez dans quelques instants.');
      }
      return;
    }

    this.errorMessage.set('');
    this.isAnalyzing.set(true);
    this.api
      .previewImport(file, context.shopId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isAnalyzing.set(false)),
      )
      .subscribe({
        next: (preview) => {
          this.preview.set(preview);
          this.selectedLineNumbers.set(
            new Set(
              preview.rows
                .filter((row) => row.action !== 'REJECT')
                .map((row) => row.lineNumber),
            ),
          );
        },
        error: (error: unknown) => this.errorMessage.set(this.importErrorMessage(error)),
      });
  }

  toggleRow(row: StockReceiptImportRowPreview, checked: boolean): void {
    if (row.action === 'REJECT' || this.selectionLocked()) {
      return;
    }
    const selected = new Set(this.selectedLineNumbers());
    checked ? selected.add(row.lineNumber) : selected.delete(row.lineNumber);
    this.selectedLineNumbers.set(selected);
  }

  toggleAllValidRows(checked: boolean): void {
    if (this.selectionLocked()) {
      return;
    }
    this.selectedLineNumbers.set(
      checked ? new Set(this.validRows().map((row) => row.lineNumber)) : new Set(),
    );
  }

  requestConfirmation(): void {
    if (this.selectedRows().length > 0 && !this.isImporting()) {
      this.showConfirmation.set(true);
    }
  }

  cancelConfirmation(): void {
    this.showConfirmation.set(false);
  }

  confirmImport(): void {
    const file = this.selectedFile();
    const context = this.sessionContext.context();
    if (!file || !context || this.selectedRows().length === 0 || this.isImporting()) {
      return;
    }

    const importId = this.executionId() ?? crypto.randomUUID();
    if (this.executionId() === null) {
      this.safetyLockChange.emit(true);
    }
    this.executionId.set(importId);
    this.showConfirmation.set(false);
    this.errorMessage.set('');
    this.isImporting.set(true);

    this.api
      .executeImport(file, context.shopId, importId, this.selectedLineNumbers())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isImporting.set(false)),
      )
      .subscribe({
        next: (report) => {
          this.report.set(report);
          this.safetyLockChange.emit(false);
          if (report.summary.failedRows > 0) {
            this.notifications.error(
              `${report.summary.failedRows} ligne(s) n’ont pas pu être importées. Consultez le rapport.`,
            );
          } else {
            this.notifications.success(`${report.summary.importedRows} ligne(s) importées avec succès.`);
          }
        },
        error: (error: unknown) => {
          if (this.isDefinitelyNotExecuted(error)) {
            this.executionId.set(null);
            this.safetyLockChange.emit(false);
          }
          this.errorMessage.set(this.importErrorMessage(error));
        },
      });
  }

  chooseAnotherFile(): void {
    this.selectedFile.set(null);
    this.clearPreparedImport();
    const input = this.fileInput()?.nativeElement;
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  retrySameImport(): void {
    this.requestConfirmation();
  }

  downloadTemplate(): void {
    if (this.isDownloadingTemplate()) {
      return;
    }
    this.isDownloadingTemplate.set(true);
    this.api
      .downloadImportTemplate()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isDownloadingTemplate.set(false)),
      )
      .subscribe({
        next: (blob) => this.saveBlob(blob, 'modele-import-produits.csv'),
        error: () => this.errorMessage.set('Le modèle n’a pas pu être téléchargé. Réessayez.'),
      });
  }

  downloadReport(): void {
    const report = this.report();
    if (!report) {
      return;
    }
    const header = ['ligne', 'statut', 'action', 'reference', 'nom', 'quantite_recue', 'erreurs'];
    const rows = report.rows.map((row) => [
      this.displayLineNumber(row.lineNumber),
      this.executionStatusLabel(row.status),
      this.actionLabel(row.action),
      row.reference,
      row.name,
      row.quantityReceived,
      row.issues.map((issue) => issue.message).join(' | '),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => this.escapeCsvCell(String(cell))).join(';'))
      .join('\r\n');
    this.saveBlob(
      new Blob([`\uFEFF${csv}\r\n`], { type: 'text/csv;charset=utf-8' }),
      `rapport-import-${report.importId}.csv`,
    );
  }

  isSelected(row: StockReceiptImportRowPreview): boolean {
    return this.selectedLineNumbers().has(row.lineNumber);
  }

  displayLineNumber(sourceLineNumber: number): number {
    return sourceLineNumber - 1;
  }

  quantity(row: StockReceiptImportRowPreview): number {
    return row.distributions.reduce((total, distribution) => total + distribution.quantity, 0);
  }

  actionLabel(action: StockReceiptImportRowAction): string {
    switch (action) {
      case 'CREATE_PRODUCT':
        return 'Créer le produit';
      case 'RECEIVE_EXISTING':
        return 'Réceptionner';
      case 'REJECT':
        return 'À corriger';
    }
  }

  executionStatusLabel(status: StockReceiptImportRowExecutionStatus): string {
    switch (status) {
      case 'IMPORTED':
        return 'Importée';
      case 'FAILED':
        return 'En erreur';
      case 'IGNORED_INVALID':
        return 'Ignorée car invalide';
      case 'IGNORED_BY_USER':
        return 'Ignorée par choix';
    }
  }

  fileSize(file: File): string {
    return file.size < 1024
      ? `${file.size} octets`
      : `${Math.ceil(file.size / 1024)} Ko`;
  }

  price(row: StockReceiptImportRowPreview): string {
    if (!row.unitPrice) {
      return '—';
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: row.unitPrice.currency,
      maximumFractionDigits: 2,
    }).format(Number(row.unitPrice.amount));
  }

  rowHasFailure(row: StockReceiptImportRowExecutionResult): boolean {
    return row.status === 'FAILED';
  }

  @HostListener('window:beforeunload', ['$event'])
  protectPendingImport(event: BeforeUnloadEvent): void {
    if (this.selectionLocked() && !this.report()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  private clearPreparedImport(): void {
    if (this.executionId() !== null) {
      this.safetyLockChange.emit(false);
    }
    this.preview.set(null);
    this.report.set(null);
    this.selectedLineNumbers.set(new Set());
    this.executionId.set(null);
    this.errorMessage.set('');
    this.showConfirmation.set(false);
  }

  private importErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Une erreur inattendue a interrompu l’import.';
    }
    if (error.status === 0) {
      return 'Connexion interrompue. Réessayez : la même opération sécurisée sera reprise sans doubler le stock.';
    }

    const problem = error.error as Partial<ProblemDetail> | null;
    switch (problem?.code) {
      case 'UNSUPPORTED_FILE':
        return 'Choisissez le modèle CSV téléchargé depuis cette page.';
      case 'FILE_TOO_LARGE':
        return 'Le fichier dépasse la taille maximale autorisée de 1 Mo.';
      case 'INVALID_ENCODING':
        return 'Le fichier doit être enregistré au format CSV UTF-8.';
      case 'INVALID_HEADER':
        return 'Les colonnes ne correspondent pas au modèle. Téléchargez un nouveau modèle.';
      case 'EMPTY_FILE':
        return 'Le fichier ne contient aucune ligne de produit.';
      case 'TOO_MANY_ROWS':
        return 'Le fichier dépasse 500 lignes. Séparez-le en plusieurs imports.';
      case 'MALFORMED_CSV':
        return 'Le fichier CSV est endommagé ou mal structuré.';
      case 'INVALID_IMPORT_SELECTION':
        return 'La sélection n’est plus valide. Analysez de nouveau le fichier.';
      case 'IMPORT_ID_REUSED':
        return 'Cette tentative ne correspond plus au fichier analysé. Analysez de nouveau le fichier.';
      default:
        return problem?.detail || 'L’import n’a pas pu être traité. Réessayez.';
    }
  }

  private isDefinitelyNotExecuted(error: unknown): boolean {
    return error instanceof HttpErrorResponse &&
      [400, 401, 403, 404, 409, 413, 422, 429].includes(error.status);
  }

  private saveBlob(blob: Blob, filename: string): void {
    const urlApi = this.document.defaultView?.URL;
    if (!urlApi) {
      this.errorMessage.set('Le téléchargement n’est pas disponible dans ce navigateur.');
      return;
    }
    const objectUrl = urlApi.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.hidden = true;
    this.document.body.append(anchor);
    anchor.click();
    anchor.remove();
    urlApi.revokeObjectURL(objectUrl);
  }

  private escapeCsvCell(value: string): string {
    return `"${value.replaceAll('"', '""')}"`;
  }
}
