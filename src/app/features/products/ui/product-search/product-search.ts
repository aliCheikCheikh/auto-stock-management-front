import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductsApiService } from '../../data-access/products-api.service';
import { ProductSearchResult } from '../../models/product.model';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';

@Component({
  selector: 'app-product-search',
  imports: [ReactiveFormsModule, MoneyPipe],
  templateUrl: './product-search.html',
  styleUrl: './product-search.scss',
})
export class ProductSearch {
  private readonly productsApiService = inject(ProductsApiService);
  private readonly router = inject(Router);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly results = signal<ProductSearchResult[]>([]);

  // Terme courant (rognée) suivi en parallèle du pipeline, sans le modifier :
  // sert à distinguer « champ trop court » de « recherche sans résultat ».
  private readonly query = toSignal(
    this.searchControl.valueChanges.pipe(map((value) => value.trim())),
    { initialValue: '' }
  );

  // Le champ a-t-il le focus : la déroulante ne s'affiche qu'à la frappe.
  readonly focused = signal(false);
  // Index de l'option surlignée pour la navigation clavier (-1 = aucune).
  readonly activeIndex = signal(-1);

  // Déroulante visible dès qu'on a des résultats OU une recherche ≥ 2 caractères
  // (pour montrer l'état vide). Masquée si champ trop court et liste vide.
  readonly showDropdown = computed(
    () => this.focused() && (this.results().length > 0 || this.query().length >= 2)
  );
  // État vide : recherche significative (≥ 2 caractères) mais aucun résultat.
  readonly showEmpty = computed(
    () => this.query().length >= 2 && this.results().length === 0
  );

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(250),
      map((value) => value.trim()),
      distinctUntilChanged(),
      switchMap((query) =>
        query.length >= 2
          ? this.productsApiService.searchProducts(query).pipe(catchError(() => of([])))
          : of([])
      ),
      takeUntilDestroyed()
    ).subscribe((results) => this.results.set(results));

    // Toute nouvelle liste réinitialise la sélection clavier.
    effect(() => {
      this.results();
      this.activeIndex.set(-1);
    });
  }

  onFocus() {
    this.focused.set(true);
  }

  onBlur() {
    this.focused.set(false);
  }

  onKeydown(event: KeyboardEvent) {
    const items = this.results();

    if (event.key === 'Escape') {
      this.close();
      return;
    }
    if (!this.showDropdown() || items.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.update((i) => (i + 1) % items.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update((i) => (i - 1 + items.length) % items.length);
        break;
      case 'Enter': {
        const index = this.activeIndex();
        if (index >= 0) {
          event.preventDefault();
          this.select(items[index]);
        }
        break;
      }
    }
  }

  // Sélection d'un résultat : ouvre la fiche produit et vide la recherche.
  select(item: ProductSearchResult) {
    this.router.navigate(['/products', item.productId]);
    this.searchControl.setValue('');
    this.close();
  }

  private close() {
    this.focused.set(false);
  }
}
