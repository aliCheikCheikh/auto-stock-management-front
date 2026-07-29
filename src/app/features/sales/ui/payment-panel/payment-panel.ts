import { Component, computed, effect, input, model, viewChild } from '@angular/core';
import { Money } from '../../../../core/api/money.model';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { CustomerPicker } from '../../../customers/ui/customer-picker/customer-picker';
import { CustomerResponse, customerDisplayName } from '../../../customers/models/customer.model';
import {
  compareAmounts,
  isPositiveAmount,
  sanitizeAmountInput,
  subtractAmounts,
} from '../../../../shared/utils/money-math';

export type PaymentMode = 'FULL' | 'CREDIT';

/**
 * Bloc paiement de la vente : comptant ou crédit, acompte, et récapitulatif
 * Total / Payé / **Reste à payer** — l'information la plus importante de
 * l'écran, annoncée au client par le vendeur.
 *
 * Le montant saisi reste une **chaîne** (précision `BigDecimal` côté backend) :
 * aucun calcul en flottant, les raccourcis « Rien » / « Tout » recopient
 * directement `0` ou le total du panier.
 */
@Component({
  selector: 'app-payment-panel',
  imports: [MoneyPipe, CustomerPicker],
  templateUrl: './payment-panel.html',
  styleUrl: './payment-panel.scss',
})
export class PaymentPanel {
  readonly total = input.required<Money>();

  readonly mode = model<PaymentMode>('FULL');
  readonly amountPaid = model<string>('0');
  readonly customer = model<CustomerResponse | null>(null);

  private readonly customerPicker = viewChild(CustomerPicker);

  readonly isCredit = computed(() => this.mode() === 'CREDIT');

  // Au comptant, le montant encaissé vaut le total du panier.
  readonly paidMoney = computed<Money>(() => {
    const total = this.total();
    return this.isCredit() ? { amount: sanitizeAmountInput(this.amountPaid()), currency: total.currency } : total;
  });

  // Affichage temps réel ; la valeur faisant foi reste l'`amountDue` du backend.
  readonly remaining = computed<Money>(() => {
    const total = this.total();
    return {
      amount: subtractAmounts(total.amount, this.paidMoney().amount),
      currency: total.currency,
    };
  });

  readonly hasRemaining = computed(() => isPositiveAmount(this.remaining().amount));

  // Le backend rejette un acompte supérieur au total (422) : signalé avant
  // l'envoi, sans réimplémenter la règle comme seule barrière.
  readonly isOverpaid = computed(
    () => compareAmounts(this.paidMoney().amount, this.total().amount) > 0
  );

  readonly missingCustomer = computed(() => this.isCredit() && this.customer() === null);

  readonly customerLabel = computed(() => {
    const customer = this.customer();
    return customer ? customerDisplayName(customer.givenName, customer.fatherName) : '';
  });

  constructor() {
    // Passer en crédit place le focus sur la recherche client : c'est le geste
    // suivant du vendeur, il n'a pas à viser le champ à la souris.
    effect(() => {
      if (this.isCredit() && this.customer() === null) {
        queueMicrotask(() => this.customerPicker()?.focus());
      }
    });
  }

  selectMode(mode: PaymentMode): void {
    this.mode.set(mode);
    if (mode === 'FULL') {
      this.amountPaid.set('0');
    }
  }

  onAmountInput(value: string): void {
    this.amountPaid.set(value);
  }

  payNothing(): void {
    this.amountPaid.set('0');
  }

  payEverything(): void {
    // Recopie de la chaîne du total : aucune conversion numérique.
    this.amountPaid.set(this.total().amount);
  }

  onCustomerSelected(customer: CustomerResponse): void {
    this.customer.set(customer);
  }

  clearCustomer(): void {
    this.customer.set(null);
    this.customerPicker()?.reset();
    queueMicrotask(() => this.customerPicker()?.focus());
  }

  // Utilisé par la page quand la validation bute sur le client manquant :
  // on renvoie le vendeur au bon champ plutôt que de lever une alerte.
  focusCustomer(): void {
    this.customerPicker()?.focus();
  }

  reset(): void {
    this.mode.set('FULL');
    this.amountPaid.set('0');
    this.customer.set(null);
    this.customerPicker()?.reset();
  }
}
