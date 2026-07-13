import { Pipe, PipeTransform } from '@angular/core';
import { Money } from '../../core/api/money.model';

// Libellés d'affichage par code devise ISO. Le backend renvoie un code
// (ex. « XAF ») ; l'UI affiche le sigle usuel (ex. « FCFA »).
const CURRENCY_LABEL: Record<string, string> = {
  XAF: 'FCFA',
  XOF: 'FCFA',
  EUR: '€',
  USD: '$',
};

const NBSP = ' ';        // espace insécable (nombre ↔ devise)
const THIN_NBSP = ' ';   // espace fine insécable (séparateur de milliers, FR)

/**
 * Formate un montant Money `{ amount, currency }` pour l'affichage.
 *   { amount: "250000", currency: "XAF" }  → « 250 000 FCFA »
 *   { amount: "45.90",  currency: "EUR" }  → « 45,90 € »
 *
 * `amount` est une string (précision BigDecimal côté backend) : on ne la
 * convertit pas en Number, on formate directement la partie entière.
 */
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(value: Money | null | undefined): string {
    if (!value || value.amount == null) {
      return '—';
    }
    return formatMoney(value);
  }
}

export function formatMoney(value: Money): string {
  const raw = String(value.amount).trim();
  const negative = raw.startsWith('-');
  const unsigned = negative ? raw.slice(1) : raw;

  const [integerPart, fractionPart = ''] = unsigned.split('.');
  const grouped = groupThousands(integerPart || '0');
  // Montant entier (ex. « .00 » XAF) → pas de décimales ; sinon on garde
  // la partie décimale telle quelle (« 45,90 »).
  const decimals = /^0*$/.test(fractionPart) ? '' : fractionPart;
  const number = decimals ? `${grouped},${decimals}` : grouped;

  const label = CURRENCY_LABEL[value.currency] ?? value.currency;
  return `${negative ? '-' : ''}${number}${NBSP}${label}`;
}

function groupThousands(integerDigits: string): string {
  return integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, THIN_NBSP);
}
