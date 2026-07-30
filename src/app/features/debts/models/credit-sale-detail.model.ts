import { Money } from '../../../core/api/money.model';

/** Un produit vendu : ce qui justifie le montant de la créance. */
export interface CreditSaleLine {
  readonly productId: string;
  readonly productName: string;
  readonly productReference: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly lineTotal: Money;
}

/**
 * Un versement. L'acompte payé le jour de la vente en fait partie, sans
 * traitement particulier : l'échéancier se lit comme une seule histoire, du
 * premier versement au dernier.
 */
export interface CreditSalePayment {
  readonly paymentId: string;
  readonly amount: Money;
  readonly receivedAt: string;
  readonly receivedById: string;
  readonly receivedByName: string | null;
}

/**
 * Détail d'une vente à crédit. `amountPaid`, `amountDue` et `settled` viennent
 * du serveur : ils sont affichés, jamais dérivés côté front.
 */
export interface CreditSaleDetailResponse {
  readonly saleId: string;
  readonly occurredAt: string;
  readonly sellerId: string;
  readonly sellerName: string | null;
  readonly customerId: string;
  readonly customerGivenName: string;
  readonly customerFatherName: string | null;
  readonly customerPhoneNumber: string;
  readonly lines: readonly CreditSaleLine[];
  readonly totalAmount: Money;
  readonly amountPaid: Money;
  readonly amountDue: Money;
  readonly settled: boolean;
  readonly payments: readonly CreditSalePayment[];
}
