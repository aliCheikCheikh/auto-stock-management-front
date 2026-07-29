import { Money } from '../../../core/api/money.model';

// Remboursement encaissé au comptoir. Le montant part en nombre nu : c'est le
// contrat du serveur (devise = celle du magasin).
export interface RecordPaymentRequest {
  readonly amount: number;
}

/**
 * État de la dette **après** encaissement, tel que renvoyé par le serveur.
 * `amountDue` et `settled` font foi : le front ne recalcule jamais le solde.
 */
export interface PaymentResponse {
  readonly saleId: string;
  readonly amountPaid: Money;
  readonly receivedAt: string;
  readonly totalAmount: Money;
  readonly totalCollected: Money;
  readonly amountDue: Money;
  readonly settled: boolean;
}

/**
 * Créance présentée au dialogue d'encaissement. Volontairement réduit à ce que
 * le dialogue affiche et envoie : il ne dépend pas de la ligne de tableau.
 */
export interface DebtPaymentTarget {
  readonly saleId: string;
  readonly customerName: string;
  readonly totalAmount: Money;
  readonly amountPaid: Money;
  readonly amountDue: Money;
}
