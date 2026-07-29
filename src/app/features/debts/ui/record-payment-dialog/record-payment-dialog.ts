import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { Money } from '../../../../core/api/money.model';
import { ProblemDetail } from '../../../../core/api/problem-detail.model';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { trapTabKey } from '../../../../shared/utils/focus-trap';
import {
  compareAmounts,
  isPositiveAmount,
  sanitizeAmountInput,
  subtractAmounts,
} from '../../../../shared/utils/money-math';
import { PaymentsApiService } from '../../data-access/payments-api.service';
import { DebtPaymentTarget, PaymentResponse } from '../../models/payment.model';

/**
 * Encaissement d'un remboursement au comptoir. Le montant est pré-rempli avec
 * le solde restant — le cas le plus fréquent : le client vient solder sa dette.
 *
 * Les bornes affichées guident la saisie ; le solde et l'état « soldé » restent
 * arrêtés par le serveur, qui reste seul juge (409 / 422 affichés ici même).
 */
@Component({
  selector: 'app-record-payment-dialog',
  imports: [ReactiveFormsModule, MoneyPipe],
  templateUrl: './record-payment-dialog.html',
  styleUrl: './record-payment-dialog.scss',
})
export class RecordPaymentDialog implements OnInit, OnDestroy {
  private readonly paymentsApi = inject(PaymentsApiService);

  readonly debt = input.required<DebtPaymentTarget>();

  readonly cancelled = output<void>();
  readonly recorded = output<PaymentResponse>();

  private readonly card = viewChild<ElementRef<HTMLElement>>('card');
  private readonly amountInput = viewChild<ElementRef<HTMLInputElement>>('amountInput');
  // Focus à restituer à la fermeture (la ligne de tableau d'où l'on vient).
  private readonly previouslyFocused = document.activeElement as HTMLElement | null;

  readonly amountControl = new FormControl('', { nonNullable: true });
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  private readonly rawAmount = toSignal(this.amountControl.valueChanges, { initialValue: '' });

  readonly amount = computed(() => sanitizeAmountInput(this.rawAmount()));

  // Solde tel qu'il sera après cet encaissement — affichage seulement.
  readonly remainingAfter = computed<Money>(() => {
    const due = this.debt().amountDue;
    return { amount: subtractAmounts(due.amount, this.amount()), currency: due.currency };
  });

  // Raison affichée à côté du bouton : jamais de bouton grisé sans explication.
  readonly blockedReason = computed(() => {
    if (!isPositiveAmount(this.amount())) {
      return 'Saisissez le montant reçu du client.';
    }
    if (compareAmounts(this.amount(), this.debt().amountDue.amount) > 0) {
      return 'Le montant dépasse le solde restant.';
    }
    return '';
  });

  readonly canSubmit = computed(() => this.blockedReason() === '' && !this.isSubmitting());

  constructor() {
    afterNextRender(() => this.amountInput()?.nativeElement.focus());
  }

  ngOnInit(): void {
    // Pré-remplissage : le solde restant, recopié en chaîne (aucun arrondi).
    this.amountControl.setValue(this.debt().amountDue.amount);
  }

  ngOnDestroy(): void {
    this.previouslyFocused?.focus();
  }

  fillFullBalance(): void {
    this.amountControl.setValue(this.debt().amountDue.amount);
    this.amountInput()?.nativeElement.focus();
  }

  // Échap ferme, Tab reste piégé dans le dialogue : le contenu de la page
  // derrière est inerte tant qu'il est ouvert.
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.cancelled.emit();
      return;
    }

    const card = this.card();
    if (event.key === 'Tab' && card) {
      trapTabKey(card.nativeElement, event);
    }
  }

  submit(): void {
    if (!this.canSubmit()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    // Seule conversion numérique : le contrat d'API attend un nombre nu.
    const request = { amount: Number(this.amount()) };

    this.paymentsApi.recordPayment(this.debt().saleId, request).subscribe({
      next: (payment) => {
        this.isSubmitting.set(false);
        this.recorded.emit(payment);
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(getPaymentErrorMessage(error));
      },
    });
  }
}

function getPaymentErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Une erreur inattendue est survenue.';
  }

  const problem = error.error as Partial<ProblemDetail> | null;

  switch (problem?.code) {
    case 'SALE_ALREADY_SETTLED':
      return 'Cette vente ne doit plus rien : la dette est déjà soldée.';
    case 'PAYMENT_EXCEEDS_AMOUNT_DUE':
      return 'Le montant dépasse le solde restant de cette vente.';
    case 'SALE_NOT_FOUND':
      return 'Cette vente est introuvable.';
    case 'VALIDATION_FAILED':
      return 'Le montant saisi est invalide.';
    default:
      return 'Impossible d’enregistrer le remboursement pour le moment.';
  }
}
