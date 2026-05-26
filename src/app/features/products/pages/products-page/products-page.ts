import { Component, inject } from '@angular/core';
import { ProductsApiService } from '../../data-access/products-api.service';
import { Product } from '../../models/product.model';
import { catchError, map, of, startWith } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../../../../core/api/problem-detail.model';


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
    catchError((error: unknown) => of({
      status: 'error',
      message: getProductsErrorMessage(error)
    } satisfies ProductsPageState))
  );


}

function getProductsErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Une erreur inattendue est survenue.';
  }

  const problem = error.error as Partial<ProblemDetail> | null;

  switch (problem?.code) {
    case 'VALIDATION_FAILED':
      return 'La demande envoyée au serveur est invalide.';

    case 'BUSINESS_RULE_VIOLATION':
      return 'Une règle métier empêche le chargement des produits.';

    default:
      return 'Impossible de charger les produits pour le moment.';
  }
}

