import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ProductsApiService } from '../../data-access/products-api.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductStockSummary } from '../../models/product.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../../../../core/api/problem-detail.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { Spinner } from '../../../../shared/ui/spinner/spinner';

type DetailState =
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly summary: ProductStockSummary }
  | { readonly status: 'error'; readonly message: string };

@Component({
  selector: 'app-product-detail-page',
  imports: [RouterLink, ConfirmDialog, Spinner],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.scss',
})
export class ProductDetailPage implements OnInit {
  private readonly productsApi = inject(ProductsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  protected productId: string | null = null;

  readonly state = signal<DetailState>({ status: 'loading' });
  readonly isOwner = computed(() => this.authService.currentUser()?.role === 'OWNER');
  // Ouverture de la confirmation de désactivation (OWNER).
  readonly confirmingDeactivation = signal(false);

  // Accès typés pour le template (le narrowing sur .status ne se propage pas
  // aux appels successifs du signal dans le HTML).
  readonly summary = computed(() => {
    const current = this.state();
    return current.status === 'success' ? current.summary : null;
  });
  readonly errorMessage = computed(() => {
    const current = this.state();
    return current.status === 'error' ? current.message : '';
  });

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('productId');
    this.load();
  }

  load(): void {
    if (this.productId === null) {
      this.state.set({ status: 'error', message: 'Produit introuvable.' });
      return;
    }

    this.state.set({ status: 'loading' });
    this.productsApi.getProductStockSummary(this.productId).subscribe({
      next: (summary) => this.state.set({ status: 'success', summary }),
      error: (error: unknown) =>
        this.state.set({ status: 'error', message: getDetailErrorMessage(error) }),
    });
  }

  // ─── Actions (fiche = hub) — réutilisent les flux existants ────────────────

  // Vendre / Réceptionner / Transférer : navigue vers l'écran existant avec le
  // produit pré-sélectionné (query param lu par la page cible).
  goToSale(): void {
    this.navigateWithProduct('/sales/new');
  }

  goToReceipt(): void {
    this.navigateWithProduct('/stock-receipts/new');
  }

  goToTransfer(): void {
    this.navigateWithProduct('/stock-transfers/new');
  }

  private navigateWithProduct(path: string): void {
    if (this.productId === null) {
      return;
    }
    this.router.navigate([path], { queryParams: { productId: this.productId } });
  }

  askDeactivation(): void {
    this.confirmingDeactivation.set(true);
  }

  cancelDeactivation(): void {
    this.confirmingDeactivation.set(false);
  }

  confirmDeactivation(): void {
    const current = this.state();
    if (this.productId === null || current.status !== 'success') {
      return;
    }
    const name = current.summary.productName;

    this.productsApi.deactivateProduct(this.productId).subscribe({
      next: () => {
        this.notifications.success(`Le produit « ${name} » a été désactivé.`);
        this.confirmingDeactivation.set(false);
        this.router.navigate(['/products']);
      },
      error: () => {
        this.notifications.error(`La désactivation du produit « ${name} » a échoué.`);
        this.confirmingDeactivation.set(false);
      },
    });
  }
}

function getDetailErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Une erreur inattendue est survenue.';
  }

  if (error.status === 404) {
    return 'Ce produit est introuvable.';
  }

  const problem = error.error as Partial<ProblemDetail> | null;

  switch (problem?.code) {
    case 'PRODUCT_NOT_FOUND':
      return 'Ce produit est introuvable.';

    case 'BUSINESS_RULE_VIOLATION':
      return 'Une règle métier empêche l’affichage de ce produit.';

    default:
      return 'Impossible de charger la fiche produit pour le moment.';
  }
}
