import { Component, computed, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ProductsApiService } from '../../data-access/products-api.service';
import { ProductSearchResult } from '../../models/product.model';
import { catchError, distinctUntilChanged, EMPTY, map, merge, of, Subject, switchMap, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';

type ProductSearchState = 'idle' | 'loading' | 'ready' | 'error';

let productPickerInstance = 0;

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

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly results = signal<ProductSearchResult[]>([]);
  readonly searchState = signal<ProductSearchState>('idle');

  private readonly query = signal('');
  private readonly retryRequests = new Subject<void>();

  readonly focused = signal(false);
  readonly activeIndex = signal(-1);

  readonly listboxId = `product-picker-listbox-${++productPickerInstance}`;
  readonly activeOptionId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? this.optionId(index) : null;
  });

  readonly showDropdown = computed(
    () => this.focused() && this.query().length >= 2
  );
  readonly showEmpty = computed(
    () => this.searchState() === 'ready' && this.results().length === 0
  );
  readonly isLoading = computed(() => this.searchState() === 'loading');
  readonly hasError = computed(() => this.searchState() === 'error');

  constructor() {
    const typedRequests = this.searchControl.valueChanges.pipe(
      map((value) => value.trim()),
      distinctUntilChanged(),
      map((query) => ({ query, debounce: true }))
    );
    const retryRequests = this.retryRequests.pipe(
      map(() => ({ query: this.query(), debounce: false }))
    );

    merge(typedRequests, retryRequests).pipe(
      switchMap(({ query, debounce }) => {
        this.query.set(query);
        this.results.set([]);

        if (query.length < 2) {
          this.searchState.set('idle');
          return EMPTY;
        }

        this.searchState.set('loading');
        const delay = debounce ? timer(250) : of(0);

        return delay.pipe(
          switchMap(() => this.productsApiService.searchProducts(query)),
          map((results) => ({ state: 'ready' as const, results })),
          catchError(() => of({ state: 'error' as const, results: [] }))
        );
      }),
      takeUntilDestroyed()
    ).subscribe(({ state, results }) => {
      this.results.set(results);
      this.searchState.set(state);
    });

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
        this.query.set('');
        this.searchState.set('idle');
      }
    });
  }

  optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
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
    } else {
      // Affiche le nom retenu (sans relancer de recherche).
      this.searchControl.setValue(item.name, { emitEvent: false });
    }
    this.query.set('');
    this.results.set([]);
    this.searchState.set('idle');
    this.close();
  }

  retrySearch() {
    if (this.query().length >= 2) {
      this.retryRequests.next();
    }
  }

  // Réinitialise le champ (ex. après soumission réussie d'un formulaire).
  reset() {
    this.searchControl.setValue('', { emitEvent: false });
    this.query.set('');
    this.results.set([]);
    this.searchState.set('idle');
    this.close();
  }

  // Rend la main au champ : le vendeur enchaîne les articles au clavier.
  focus() {
    this.searchInput()?.nativeElement.focus();
  }

  private close() {
    this.focused.set(false);
  }
}
