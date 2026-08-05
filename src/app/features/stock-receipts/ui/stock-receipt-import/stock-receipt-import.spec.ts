import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockReceiptImportPreview } from '../../models/stock-receipt-import.model';
import { StockReceiptImport } from './stock-receipt-import';

describe('StockReceiptImport', () => {
  let fixture: ComponentFixture<StockReceiptImport>;
  let component: StockReceiptImport;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StockReceiptImport],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(StockReceiptImport);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    httpTesting.expectOne('/api/v1/context').flush({
      shopId: 'shop-1',
      locations: [
        { type: 'SHOP_FLOOR', locationId: 'surface-1', label: 'Surface' },
        { type: 'BACKSTOCK', locationId: 'reserve-1', label: 'Réserve' },
      ],
    });
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('sélectionne uniquement les lignes valides après la prévisualisation', () => {
    selectCsvFile();

    component.analyze();
    const request = httpTesting.expectOne('/api/v1/stock-receipts/import-preview');
    expect((request.request.body as FormData).get('shopId')).toBe('shop-1');
    request.flush(preview());
    fixture.detectChanges();

    expect(component.selectedLineNumbers()).toEqual(new Set([2]));
    expect(component.selectedQuantity()).toBe(8);
    expect(fixture.nativeElement.textContent).toContain('Vérifier les produits');
    expect(fixture.nativeElement.textContent).toContain('Cette référence apparaît plusieurs fois');
  });

  it('exécute seulement la sélection confirmée et affiche le rapport', () => {
    const safetyStates: boolean[] = [];
    component.safetyLockChange.subscribe((locked) => safetyStates.push(locked));
    preparePreview();

    component.requestConfirmation();
    expect(component.showConfirmation()).toBeTrue();
    component.confirmImport();

    const request = httpTesting.expectOne('/api/v1/stock-receipts/import-executions');
    const body = request.request.body as FormData;
    expect(body.getAll('selectedLineNumbers')).toEqual(['2']);
    expect(body.get('importId')).toMatch(/^[0-9a-f-]{36}$/);
    request.flush(executionReport(String(body.get('importId'))));
    fixture.detectChanges();

    expect(safetyStates).toEqual([true, false]);
    expect(component.report()?.summary.importedRows).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Import terminé avec succès');
  });

  it('réutilise le même identifiant après une coupure réseau ambiguë', () => {
    preparePreview();

    component.requestConfirmation();
    component.confirmImport();
    const firstRequest = httpTesting.expectOne('/api/v1/stock-receipts/import-executions');
    const firstImportId = String((firstRequest.request.body as FormData).get('importId'));
    firstRequest.error(new ProgressEvent('error'));

    expect(component.selectionLocked()).toBeTrue();
    expect(component.errorMessage()).toContain('sans doubler le stock');

    component.retrySameImport();
    component.confirmImport();
    const retryRequest = httpTesting.expectOne('/api/v1/stock-receipts/import-executions');
    expect((retryRequest.request.body as FormData).get('importId')).toBe(firstImportId);
    retryRequest.flush(executionReport(firstImportId));
  });

  it('refuse un fichier non CSV avant tout appel au serveur', () => {
    selectFile(new File(['contenu'], 'produits.xlsx'));

    component.analyze();

    expect(component.selectedFile()).toBeNull();
    expect(component.errorMessage()).toContain('format CSV');
    httpTesting.expectNone('/api/v1/stock-receipts/import-preview');
  });

  function preparePreview(): void {
    selectCsvFile();
    component.analyze();
    httpTesting.expectOne('/api/v1/stock-receipts/import-preview').flush(preview());
  }

  function selectCsvFile(): void {
    selectFile(new File(['reference;nom_produit\nREF-1;Filtre\n'], 'produits.csv', {
      type: 'text/csv',
    }));
  }

  function selectFile(file: File): void {
    const input = {
      files: { item: () => file },
      value: file.name,
    } as unknown as HTMLInputElement;
    component.onFileSelected({ target: input } as unknown as Event);
  }

  function preview(): StockReceiptImportPreview {
    return {
      summary: {
        totalRows: 2,
        productsToCreate: 1,
        existingProductsToReceive: 0,
        invalidRows: 1,
      },
      rows: [
        {
          lineNumber: 2,
          action: 'CREATE_PRODUCT',
          reference: 'REF-1',
          name: 'Filtre à huile',
          categoryName: 'Moteur',
          categoryId: 'category-1',
          unitPrice: { amount: '12500', currency: 'XAF' },
          minimumGlobalThreshold: 2,
          productId: null,
          distributions: [{ locationId: 'surface-1', quantity: 8 }],
          issues: [],
        },
        {
          lineNumber: 3,
          action: 'REJECT',
          reference: 'REF-2',
          name: 'Plaquette',
          categoryName: 'Freinage',
          categoryId: null,
          unitPrice: null,
          minimumGlobalThreshold: null,
          productId: null,
          distributions: [],
          issues: [
            {
              field: 'reference',
              code: 'DUPLICATE_REFERENCE_IN_FILE',
              message: 'Cette référence apparaît plusieurs fois dans le fichier.',
            },
          ],
        },
      ],
    };
  }

  function executionReport(importId: string) {
    return {
      importId,
      rows: [
        {
          lineNumber: 2,
          status: 'IMPORTED',
          action: 'CREATE_PRODUCT',
          reference: 'REF-1',
          name: 'Filtre à huile',
          productId: 'product-1',
          quantityReceived: 8,
          issues: [],
        },
        {
          lineNumber: 3,
          status: 'IGNORED_INVALID',
          action: 'REJECT',
          reference: 'REF-2',
          name: 'Plaquette',
          productId: null,
          quantityReceived: 0,
          issues: [
            {
              field: 'reference',
              code: 'DUPLICATE_REFERENCE_IN_FILE',
              message: 'Cette référence apparaît plusieurs fois dans le fichier.',
            },
          ],
        },
      ],
      summary: {
        totalRows: 2,
        selectedRows: 1,
        importedRows: 1,
        productsCreated: 1,
        existingProductsReceived: 0,
        ignoredInvalidRows: 1,
        ignoredByUserRows: 0,
        failedRows: 0,
        totalQuantityReceived: 8,
      },
    };
  }
});
