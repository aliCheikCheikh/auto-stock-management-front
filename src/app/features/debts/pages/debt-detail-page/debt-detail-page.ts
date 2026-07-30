import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { Spinner } from '../../../../shared/ui/spinner/spinner';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { CreditSaleLines } from '../../ui/credit-sale-lines/credit-sale-lines';
import { PaymentTimeline } from '../../ui/payment-timeline/payment-timeline';
import { RecordPaymentDialog } from '../../ui/record-payment-dialog/record-payment-dialog';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { formatMoney } from '../../../../shared/pipes/money.pipe';
import { authorLabel } from '../../../../shared/utils/author';
import { customerDisplayName, telHref } from '../../../customers/models/customer.model';
import { DebtsApiService } from '../../data-access/debts-api.service';
import { CreditSaleDetailResponse } from '../../models/credit-sale-detail.model';
import { DebtPaymentTarget, PaymentResponse } from '../../models/payment.model';

type DetailState = 'loading' | 'success' | 'not-found' | 'error';

/**
 * Détail d'une vente à crédit : ce qui a été vendu, par qui, quand, ce qui a
 * été versé et ce qui reste. Le patron doit pouvoir justifier un solde devant
 * le client, pas seulement le lire.
 *
 * Tous les montants viennent du serveur (`amountPaid`, `amountDue`, `settled`).
 */
@Component({
  selector: 'app-debt-detail-page',
  templateUrl: './debt-detail-page.html',
  styleUrl: './debt-detail-page.scss',
  imports: [
    RouterLink,
    DatePipe,
    MoneyPipe,
    Spinner,
    EmptyState,
    CreditSaleLines,
    PaymentTimeline,
    RecordPaymentDialog,
  ],
})
export class DebtDetailPage implements OnInit {
  private readonly debtsApi = inject(DebtsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);

  private readonly saleId = signal('');

  readonly state = signal<DetailState>('loading');
  readonly detail = signal<CreditSaleDetailResponse | null>(null);
  readonly isPaymentOpen = signal(false);

  readonly customerName = computed(() => {
    const detail = this.detail();
    return detail ? customerDisplayName(detail.customerGivenName, detail.customerFatherName) : '';
  });

  readonly sellerName = computed(() => authorLabel(this.detail()?.sellerName));

  readonly phoneHref = computed(() => telHref(this.detail()?.customerPhoneNumber ?? ''));

  // Cible du dialogue d'encaissement, déjà écrit pour la liste des créances.
  readonly paymentTarget = computed<DebtPaymentTarget | null>(() => {
    const detail = this.detail();
    if (!detail) {
      return null;
    }
    return {
      saleId: detail.saleId,
      customerName: this.customerName(),
      totalAmount: detail.totalAmount,
      amountPaid: detail.amountPaid,
      amountDue: detail.amountDue,
    };
  });

  ngOnInit(): void {
    this.saleId.set(this.route.snapshot.paramMap.get('saleId') ?? '');
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.debtsApi.getDebt(this.saleId()).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.state.set('success');
      },
      error: (error: unknown) => {
        // 404 : vente inexistante, ou réglée au comptant — donc pas une créance.
        this.state.set(error instanceof HttpErrorResponse && error.status === 404 ? 'not-found' : 'error');
      },
    });
  }

  openPayment(): void {
    this.isPaymentOpen.set(true);
  }

  closePayment(): void {
    this.isPaymentOpen.set(false);
  }

  // Le solde annoncé est celui du serveur : on recharge le détail plutôt que
  // de retoucher les montants localement.
  onPaymentRecorded(payment: PaymentResponse): void {
    this.isPaymentOpen.set(false);
    this.notifications.success(
      payment.settled
        ? 'Dette soldée'
        : `Remboursement encaissé — reste à payer : ${formatMoney(payment.amountDue)}`
    );
    this.load();
  }
}
