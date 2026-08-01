import { Money } from '../../core/api/money.model';
import { isPositiveAmount } from './money-math';

/**
 * Forme du règlement d'une vente, lue depuis le **seul** champ qui la porte
 * (`saleAmountDue` sur un mouvement, `amountDue` sur une créance) :
 *  - `null` : l'opération ne vient d'aucune vente (réception, transfert) ;
 *  - `paid` : solde à zéro, la vente est réglée ;
 *  - `credit` : solde positif, avec le montant restant dû.
 *
 * Aucun montant n'est recalculé et aucun booléen local ne double l'information :
 * deux sources finiraient par se contredire.
 */
export type SaleSettlement =
  | { readonly kind: 'paid' }
  | { readonly kind: 'credit'; readonly amountDue: Money };

export function saleSettlementOf(amountDue: Money | null | undefined): SaleSettlement | null {
  if (!amountDue) {
    return null;
  }
  return isPositiveAmount(amountDue.amount) ? { kind: 'credit', amountDue } : { kind: 'paid' };
}
