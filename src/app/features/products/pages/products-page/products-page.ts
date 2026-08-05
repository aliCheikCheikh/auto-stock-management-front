import { Component, computed, inject, signal } from '@angular/core';
import { ProductsApiService } from '../../data-access/products-api.service';
import { StockLevelsApiService } from '../../../stock/data-access/stock-levels-api.service';
import { Product } from '../../models/product.model';
import { forkJoin, catchError, map, of, startWith, BehaviorSubject, switchMap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../../../../core/api/problem-detail.model';
import { StockLevel } from '../../../stock/models/stock-level.model';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { Spinner } from '../../../../shared/ui/spinner/spinner';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { PageMeta } from '../../../../core/api/page.model';

const PRODUCTS_PAGE_SIZE = 20;
const STOCK_LEVELS_PAGE_SIZE = 100;

type ProductsPageState =
  | { readonly status: 'loading' }
  | {
      readonly status: 'success';
      readonly products: readonly ProductListItem[];
      readonly page: PageMeta;
    }
  | { readonly status: 'error'; readonly message: string }



type StockStatus = 'ok' | 'low' | 'critical';

interface ProductListItem {
  readonly product: Product;
  readonly globalQuantity: number;
  readonly stockStatus: StockStatus;
}

@Component({
  selector: 'app-products-page',
  imports: [AsyncPipe, RouterLink, ConfirmDialog, MoneyPipe, Spinner, EmptyState, Pagination],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
})
export class ProductsPage {
  private readonly productsApi = inject(ProductsApiService);
  private readonly stockLevelsApi = inject(StockLevelsApiService);
  private readonly authService = inject(AuthService);
  readonly isOwner = computed(() => this.authService.currentUser()?.role === 'OWNER');
  readonly productToDeactivate = signal<Product | null>(null);
  private readonly notifications = inject(NotificationService);
  private readonly requestedPage$ = new BehaviorSubject(0);


  readonly state$ = this.requestedPage$.pipe(
    switchMap((pageIndex) => forkJoin({
      productsPage: this.productsApi.listProducts(true, PRODUCTS_PAGE_SIZE, pageIndex),
      stockLevelsPage: this.stockLevelsApi.listStockLevels({ size: STOCK_LEVELS_PAGE_SIZE })
    }).pipe(
      map(({ productsPage, stockLevelsPage }): ProductsPageState => {
        const globalQuantityByProductId = buildGlobalQuantityByProductId(stockLevelsPage.content);

        return {
          status: 'success',
          page: productsPage.page,
          products: productsPage.content.map((product): ProductListItem => {
            const globalQuantity = globalQuantityByProductId.get(product.productId) ?? 0;

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
      } satisfies ProductsPageState)))

    ));

  askDeactivation(product: Product): void {
    this.productToDeactivate.set(product);
  }

  goToPage(index: number): void {
    if (index < 0) return;
    this.requestedPage$.next(index);
  }

  cancelDeactivation(): void {
    this.productToDeactivate.set(null);
  }

  confirmDeactivation(): void {
    const product = this.productToDeactivate();
    if (!product) {
      return;
    }
    this.productsApi.deactivateProduct(product.productId).subscribe({
      next: () => {
        this.notifications.success(`Le produit « ${product.name} » a été désactivé.`);
        this.productToDeactivate.set(null);
        this.requestedPage$.next(this.requestedPage$.value);
      },
      error: () => {
        this.notifications.error(`La désactivation du produit « ${product.name} » a échoué.`);
        this.productToDeactivate.set(null);
      }

    })
  }


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


export function getStockStatus(product: Product, globalQuantity: number): StockStatus {
  if (globalQuantity === 0) {
    return 'critical';
  }

  if (globalQuantity < product.minimumGlobalThreshold) {
    return 'low';
  }

  return 'ok';
}

function buildGlobalQuantityByProductId(
  stockLevels: readonly StockLevel[]
): ReadonlyMap<string, number> {
  const quantities = new Map<string, number>();

  for (const stockLevel of stockLevels) {
    const currentQuantity = quantities.get(stockLevel.productId) ?? 0;

    quantities.set(stockLevel.productId, currentQuantity + stockLevel.quantity);
  }

  return quantities;
}
