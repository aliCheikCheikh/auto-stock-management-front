import { Component, inject } from '@angular/core';
import { ProductsApiService } from '../../data-access/products-api.service';
import { Product } from '../../models/product.model';
import { catchError, map, of, startWith } from 'rxjs';
import { AsyncPipe } from '@angular/common';

type ProductsPageState =
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly products: readonly Product[] }
  | { readonly status: 'error'; readonly message: string }

@Component({
  selector: 'app-products-page',
  imports: [AsyncPipe],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
})
export class ProductsPage {
  private readonly productsApi = inject(ProductsApiService);
  readonly state$ = this.productsApi.listProducts().pipe(
    map((page): ProductsPageState => ({
      status: 'success',
      products: page.content
    })
    ), startWith({ status: 'loading' } satisfies ProductsPageState),
    catchError(() => of({
      status: 'error',
      message: 'impossible de charger les produits pour le moment'
    } satisfies ProductsPageState))
  );


}
