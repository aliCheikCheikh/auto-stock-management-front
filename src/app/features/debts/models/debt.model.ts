import { Money } from '../../../core/api/money.model';

/**
 * Créance en cours : une vente à crédit dont le solde n'est pas soldé.
 * Le backend renvoie la liste triée du plus ancien au plus récent.
 */
export interface OutstandingDebtResponse {
  readonly saleId: string;
  readonly occurredAt: string;
  readonly customerId: string;
  readonly customerGivenName: string;
  readonly customerFatherName: string | null;
  readonly customerPhoneNumber: string;
  readonly totalAmount: Money;
  readonly amountPaid: Money;
  readonly amountDue: Money;
  // Ancienneté et statut de retard calculés par le backend (`CreditPolicy`) :
  // le seuil de retard est une règle métier, jamais recalculée côté front.
  readonly daysOutstanding: number;
  readonly overdue: boolean;
}
