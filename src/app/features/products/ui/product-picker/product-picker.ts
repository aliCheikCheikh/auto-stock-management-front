import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ProductsApiService } from '../../data-access/products-api.service';
import { ProductSearchResult } from '../../models/product.model';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';

/**
 * Cœur de recherche produit réutilisable (recherche trigramme via
 * `ProductsApiService.searchProducts`) : champ + déroulante « à la frappe » +
 * navigation clavier. Au lieu de naviguer, il **émet** le produit choisi.
 *
 * Deux usages partagent ce même cœur :
 *  - barre globale de la navbar (`variant="navbar"`, `clearOnSelect`) qui
 *    navigue vers la fiche (cf. ProductSearch) ;
 *  - sélecteur de formulaire (`variant="field"`) qui renseigne un contrôle.
 */
@Component({
  selector: 'app-product-picker',
  imports: [ReactiveFormsModule, MoneyPipe],
  templateUrl: './product-picker.html',
  styleUrl: './product-picker.scss',
  host: { '[attr.data-variant]': 'variant()' },
})
export class ProductPicker {
  private readonly productsApiService = inject(ProductsApiService);

  // Apparence : 'field' (formulaires, fond clair) ou 'navbar' (chrome navy,
  // champ translucide). Le comportement de recherche est identique.
  readonly variant = input<'field' | 'navbar'>('field');
  readonly placeholder = input('Rechercher un produit…');
  readonly ariaLabel = input('Rechercher un produit');
  // Id du champ, pour l'associer à un <label for> de formulaire.
  readonly inputId = input<string | null>(null);
  // Marque le champ comme cible du raccourci clavier « / » (barre globale).
  readonly global = input(false);
  // Vide le champ après sélection (navbar) au lieu d'afficher le nom retenu.
  readonly clearOnSelect = input(false);
  // Libellé initial (pré-sélection depuis la fiche produit) affiché sans
  // relancer de recherche.
  readonly initialLabel = input('');

  readonly selected = output<ProductSearchResult>();

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly results = signal<ProductSearchResult[]>([]);

  // Terme courant (rogné) suivi en parallèle : distingue « champ trop court »
  // de « recherche sans résultat ».
  private readonly query = toSignal(
    this.searchControl.valueChanges.pipe(map((value) => value.trim())),
    { initialValue: '' }
  );

  readonly focused = signal(false);
  readonly activeIndex = signal(-1);

  readonly showDropdown = computed(
    () => this.focused() && (this.results().length > 0 || this.query().length >= 2)
  );
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

    // Pré-remplissage : affiche le libellé fourni sans déclencher le pipeline.
    effect(() => {
      const label = this.initialLabel();
      if (label) {
        this.searchControl.setValue(label, { emitEvent: false });
      }
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

  select(item: ProductSearchResult) {
    this.selected.emit(item);
    if (this.clearOnSelect()) {
      this.searchControl.setValue('', { emitEvent: false });
      this.results.set([]);
    } else {
      // Affiche le nom retenu (sans relancer de recherche).
      this.searchControl.setValue(item.name, { emitEvent: false });
    }
    this.close();
  }

  // Réinitialise le champ (ex. après soumission réussie d'un formulaire).
  reset() {
    this.searchControl.setValue('', { emitEvent: false });
    this.results.set([]);
    this.close();
  }

  private close() {
    this.focused.set(false);
  }
}
