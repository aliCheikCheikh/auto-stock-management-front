import { Money } from '../../core/api/money.model';

/**
 * Arithmétique sur des montants décimaux exprimés en chaîne (`BigDecimal` côté
 * backend). On ne convertit jamais un montant en `Number` : les décimales sont
 * alignées puis le calcul se fait en `BigInt`, sans erreur d'arrondi flottante.
 *
 * Ces helpers servent uniquement à l'affichage temps réel (récapitulatif de
 * paiement, total des créances) : la valeur faisant foi reste celle du backend.
 */

const AMOUNT_PATTERN = /^-?\d+(\.\d+)?$/;

export function addAmounts(a: string, b: string): string {
  const scale = Math.max(scaleOf(a), scaleOf(b));
  return fromScaled(toScaled(a, scale) + toScaled(b, scale), scale);
}

export function subtractAmounts(a: string, b: string): string {
  const scale = Math.max(scaleOf(a), scaleOf(b));
  return fromScaled(toScaled(a, scale) - toScaled(b, scale), scale);
}

// Multiplication par une quantité entière (sous-total d'une ligne de panier).
export function multiplyAmount(amount: string, quantity: number): string {
  const scale = scaleOf(amount);
  const factor = BigInt(Math.trunc(quantity));
  return fromScaled(toScaled(amount, scale) * factor, scale);
}

// -1 si a < b, 0 si égaux, 1 si a > b.
export function compareAmounts(a: string, b: string): number {
  const scale = Math.max(scaleOf(a), scaleOf(b));
  const left = toScaled(a, scale);
  const right = toScaled(b, scale);
  if (left < right) return -1;
  return left > right ? 1 : 0;
}

export function isPositiveAmount(amount: string): boolean {
  return compareAmounts(amount, '0') > 0;
}

// Somme d'une liste de Money. La devise retenue est celle du premier élément
// (le backend n'expose qu'une devise par magasin).
export function sumMoney(values: readonly Money[], fallbackCurrency = 'XAF'): Money {
  const total = values.reduce((sum, value) => addAmounts(sum, sanitize(value?.amount)), '0');
  return { amount: total, currency: values[0]?.currency ?? fallbackCurrency };
}

function sanitize(amount: string | null | undefined): string {
  const raw = String(amount ?? '').trim();
  return AMOUNT_PATTERN.test(raw) ? raw : '0';
}

function scaleOf(amount: string): number {
  const [, fraction = ''] = sanitize(amount).split('.');
  return fraction.length;
}

function toScaled(amount: string, scale: number): bigint {
  const raw = sanitize(amount);
  const negative = raw.startsWith('-');
  const unsigned = negative ? raw.slice(1) : raw;
  const [integerPart = '0', fraction = ''] = unsigned.split('.');
  const padded = (fraction + '0'.repeat(scale)).slice(0, scale);
  const digits = BigInt((integerPart || '0') + padded);
  return negative ? -digits : digits;
}

function fromScaled(value: bigint, scale: number): string {
  const negative = value < 0n;
  const digits = (negative ? -value : value).toString().padStart(scale + 1, '0');
  const integerPart = digits.slice(0, digits.length - scale);
  const fraction = scale > 0 ? digits.slice(digits.length - scale) : '';
  return `${negative ? '-' : ''}${integerPart}${fraction ? `.${fraction}` : ''}`;
}
