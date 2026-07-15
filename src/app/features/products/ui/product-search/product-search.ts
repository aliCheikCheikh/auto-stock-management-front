import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ProductPicker } from '../product-picker/product-picker';
import { ProductSearchResult } from '../../models/product.model';

/**
 * Barre de recherche globale de la navbar. Réutilise ProductPicker (le cœur de
 * recherche partagé) et, à la sélection, **navigue** vers la fiche produit —
 * là où un picker de formulaire se contenterait d'émettre.
 */
@Component({
  selector: 'app-product-search',
  imports: [ProductPicker],
  templateUrl: './product-search.html',
})
export class ProductSearch {
  private readonly router = inject(Router);

  goToProduct(product: ProductSearchResult) {
    this.router.navigate(['/products', product.productId]);
  }
}
