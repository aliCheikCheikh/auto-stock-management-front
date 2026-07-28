import { Component, input, output } from '@angular/core';
import { Money } from '../../../../core/api/money.model';
import { CartLine, CartQuantityChange } from '../../models/cart-line.model';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';

/**
 * Panier de la vente en cours : lignes denses, quantité modifiable **dans la
 * ligne** (pas de retrait/ré-ajout), montants alignés à droite en chiffres
 * tabulaires. Purement présentationnel : l'état vit dans la page.
 */
@Component({
  selector: 'app-sale-cart',
  imports: [MoneyPipe, EmptyState],
  templateUrl: './sale-cart.html',
  styleUrl: './sale-cart.scss',
})
export class SaleCart {
  readonly lines = input.required<readonly CartLine[]>();
  readonly total = input.required<Money>();

  readonly quantityChanged = output<CartQuantityChange>();
  readonly removed = output<string>();

  step(line: CartLine, delta: number): void {
    this.setQuantity(line, line.quantity + delta);
  }

  onQuantityInput(line: CartLine, value: string): void {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      return;
    }
    this.setQuantity(line, parsed);
  }

  private setQuantity(line: CartLine, quantity: number): void {
    // Une quantité nulle ou négative n'a pas de sens : la ligne reste à 1, le
    // retrait explicite passe par le bouton dédié.
    const next = Math.max(1, quantity);
    if (next === line.quantity) {
      return;
    }
    this.quantityChanged.emit({ productId: line.productId, quantity: next });
  }
}
