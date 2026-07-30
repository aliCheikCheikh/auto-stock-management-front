import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { authorLabel } from '../../../../shared/utils/author';
import { CreditSalePayment } from '../../models/credit-sale-detail.model';

interface TimelineEntry {
  readonly paymentId: string;
  readonly amount: CreditSalePayment['amount'];
  readonly receivedAt: string;
  readonly receivedBy: string;
}

/**
 * Échéancier des versements. L'acompte du jour de la vente y figure comme les
 * autres : le patron lit une seule histoire, du premier versement au dernier.
 */
@Component({
  selector: 'app-payment-timeline',
  imports: [DatePipe, MoneyPipe],
  templateUrl: './payment-timeline.html',
  styleUrl: './payment-timeline.scss',
})
export class PaymentTimeline {
  readonly payments = input.required<readonly CreditSalePayment[]>();

  readonly entries = computed<TimelineEntry[]>(() =>
    this.payments().map((payment) => ({
      paymentId: payment.paymentId,
      amount: payment.amount,
      receivedAt: payment.receivedAt,
      receivedBy: authorLabel(payment.receivedByName),
    }))
  );
}
