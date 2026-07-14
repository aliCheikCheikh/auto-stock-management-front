import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ProductsApiService } from '../../data-access/products-api.service';
import { ProductSearchResult } from '../../models/product.model';
import { debounceTime, distinctUntilChanged, filter, map, of, switchAll, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-search',
  imports: [ReactiveFormsModule],
  templateUrl: './product-search.html',
  styleUrl: './product-search.scss',
})
export class ProductSearch {
  private readonly productsApiService = inject(ProductsApiService);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly results = signal<ProductSearchResult[]>([]);

  constructor() {
   this.searchControl.valueChanges.pipe(
      debounceTime(250),
      map((value) => value.trim()),
      distinctUntilChanged(),
      switchMap((query) =>
        query.length >= 2 ? this.productsApiService.searchProducts(query) : of([])
      ),
      takeUntilDestroyed()
    ).subscribe((results) => this.results.set(results));
  }

}
