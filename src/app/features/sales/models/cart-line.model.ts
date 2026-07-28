import { Money } from '../../../core/api/money.model';

// Ligne du panier en cours de saisie (état local de l'écran de vente).
export interface CartLine {
  readonly productId: string;
  readonly productLabel: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly subtotal: Money;
}

export interface CartQuantityChange {
  readonly productId: string;
  readonly quantity: number;
}
