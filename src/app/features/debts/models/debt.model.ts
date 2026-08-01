import { Money } from '../../../core/api/money.model';

/**
 * Filtre de statut accepté par le serveur. L'ordre de la liste en découle et
 * n'est pas négociable côté front : les créances en cours arrivent de la plus
 * ancienne à la plus récente (c'est celle-là qu'on relance), les soldées du
 * règlement le plus récent au plus ancien.
 */
export type DebtStatus = 'OUTSTANDING' | 'SETTLED' | 'ALL';

export const DEBT_STATUSES: readonly DebtStatus[] = ['OUTSTANDING', 'SETTLED', 'ALL'];

export function isDebtStatus(value: string | null | undefined): value is DebtStatus {
  return value === 'OUTSTANDING' || value === 'SETTLED' || value === 'ALL';
}

/**
 * Une vente à crédit, réglée ou non.
 *
 * `daysOutstanding` et `overdue` sont arrêtés par le serveur (`CreditPolicy`)
 * et **changent de sens** selon `settled` :
 *  - créance ouverte : nombre de jours écoulés depuis la vente, et « en retard
 *    aujourd'hui » ;
 *  - créance soldée : nombre de jours qu'il a fallu pour régler, et « a été
 *    réglée au-delà du délai toléré ».
 */
export interface DebtResponse {
  readonly saleId: string;
  readonly occurredAt: string;
  readonly customerId: string;
  readonly customerGivenName: string;
  readonly customerFatherName: string | null;
  readonly customerPhoneNumber: string;
  readonly totalAmount: Money;
  readonly amountPaid: Money;
  readonly amountDue: Money;
  readonly settled: boolean;
  // Date du dernier encaissement ; null tant que la créance est ouverte.
  readonly settledAt: string | null;
  readonly daysOutstanding: number;
  readonly overdue: boolean;
}

export interface DebtQuery {
  readonly status?: DebtStatus;
  readonly customerId?: string;
  readonly page?: number;
  readonly size?: number;
}
