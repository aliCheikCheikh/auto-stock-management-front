import { Component, inject } from '@angular/core';
import { ProductsApiService } from '../../data-access/products-api.service';
import { StockLevelsApiService } from '../../../stock/data-access/stock-levels-api.service';
import { Product } from '../../models/product.model';
import { forkJoin, catchError, map, of, startWith } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../../../../core/api/problem-detail.model';
import { StockLevel } from '../../../stock/models/stock-level.model';


type ProductsPageState =
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly products: readonly ProductListItem[] }
  | { readonly status: 'error'; readonly message: string }



type StockStatus = 'ok' | 'low' | 'critical';

interface ProductListItem {
  readonly product: Product;
  readonly globalQuantity: number;
  readonly stockStatus: StockStatus;
}

@Component({
  selector: 'app-products-page',
  imports: [AsyncPipe],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
})
export class ProductsPage {
  private readonly productsApi = inject(ProductsApiService);
  private readonly stockLevelsApi = inject(StockLevelsApiService);

  readonly state$ = forkJoin({
    productsPage: this.productsApi.listProducts(),
    stockLevelsPage: this.stockLevelsApi.listStockLevels({ size: 200 })
  }).pipe(
    map(({ productsPage, stockLevelsPage }): ProductsPageState => {
      const stockLevels = stockLevelsPage.content;

      return {
        status: 'success',
        products: productsPage.content.map((product): ProductListItem => {
          const globalQuantity = getGlobalQuantity(stockLevels, product.productId);

          return {
            product,
            globalQuantity,
            stockStatus: getStockStatus(product, globalQuantity),
          };
        }),
      };
    }),
    startWith({ status: 'loading' } satisfies ProductsPageState),
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


function getStockStatus(product: Product, globalQuantity: number): StockStatus {
  if (globalQuantity === 0) {
    return 'critical';
  }

  if (globalQuantity <= product.minimumGlobalThreshold) {
    return 'low';
  }

  return 'ok';
}


function getGlobalQuantity(stockLevels: readonly StockLevel[], productId: string): number {
  let total = 0;

  for (const stockLevel of stockLevels) {
    if (stockLevel.productId === productId) {
      total += stockLevel.quantity;
    }
  }

  return total;
}

