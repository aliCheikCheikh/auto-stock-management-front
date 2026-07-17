import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { SalesApiService } from '../../data-access/sales-api.service';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateSaleRequest } from '../../models/sales.model';
import { SessionContextService } from '../../../../core/session/session-context.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../../../../core/api/problem-detail.model';
import { ProductsApiService } from '../../../products/data-access/products-api.service';
import { ProductSearchResult } from '../../../products/models/product.model';
import { Money } from '../../../../core/api/money.model';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { ActivatedRoute } from '@angular/router';
import { ProductPicker } from '../../../products/ui/product-picker/product-picker';
import { ConfirmDialog } from '../../../../shared/ui/confirm-dialog/confirm-dialog';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';

interface CartLine {
  productId: string;
  productLabel: string;
  quantity: number;
  unitPrice: Money;
  subtotal: Money;
}

interface PendingProduct {
  productId: string;
  label: string;
  unitPrice: Money;
}

@Component({
  selector: 'app-new-sale-page',
  imports: [ReactiveFormsModule, ProductPicker, ConfirmDialog, MoneyPipe, EmptyState],
  templateUrl: './new-sale-page.html',
  styleUrl: './new-sale-page.scss',
})
export class NewSalePage implements OnInit {
  private readonly salesApi = inject(SalesApiService);
  private readonly productsApi = inject(ProductsApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly sessionContext = inject(SessionContextService);

  // Libellé pré-rempli du picker (pré-sélection depuis la fiche produit).
  readonly preselectedLabel = signal('');
  private readonly picker = viewChild(ProductPicker);

  currentIdempotencyKey: string | null = null;
  isSubmitting = false;
  readonly cart = signal<CartLine[]>([]);
  readonly confirmingPendingRemoval = signal(false);

  // Source de vérité unique : le produit sélectionné mais pas encore ajouté au
  // panier. Renseigné par le picker ou la pré-sélection, remis à null à l'ajout.
  readonly selectedProduct = signal<ProductSearchResult | null>(null);

  readonly pendingProduct = computed<PendingProduct | null>(() => {
    const selected = this.selectedProduct();
    if (!selected) {
      return null;
    }
    return {
      productId: selected.productId,
      label: selected.name,
      unitPrice: selected.unitPrice,
    };
  });

  readonly hasPendingProduct = computed(() => this.selectedProduct() !== null);

  readonly cartTotal = computed<Money>(() => {
    const totalAmount = this.cart().reduce((sum, line) => sum + Number(line.subtotal.amount), 0);
    return {
      amount: totalAmount.toString(),
      currency: this.cart()[0]?.unitPrice.currency ?? 'XAF',
    };
  });

  readonly form = new FormGroup({
    productId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    quantity: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
  });

  ngOnInit(): void {
    // Charge le contexte magasin (shopId réel) une fois, mis en cache.
    this.sessionContext.ensureLoaded().subscribe({
      error: () => this.notificationService.error('Impossible de charger le contexte du magasin.'),
    });

    // Pré-sélection éventuelle depuis la fiche produit (?productId=…).
    const productId = this.route.snapshot.queryParamMap.get('productId');
    if (productId) {
      this.productsApi.getProduct(productId).subscribe({
        next: (product) => {
          this.form.controls.productId.setValue(product.productId);
          this.preselectedLabel.set(product.name);
          this.selectedProduct.set(product);
        },
        error: () => this.notificationService.error('Le produit pré-sélectionné est introuvable.'),
      });
    }
  }

  // Le picker n'est pas un contrôle de formulaire : on reporte le choix dans le
  // contrôle productId (source de vérité pour la validation) et dans selectedProduct.
  onProductSelected(product: ProductSearchResult): void {
    this.form.controls.productId.setValue(product.productId);
    this.form.controls.productId.markAsDirty();
    this.form.controls.productId.markAsTouched();
    this.selectedProduct.set(product);
  }

  addToCart(): void {
    const selected = this.selectedProduct();
    if (!selected) {
      this.notificationService.error('Sélectionnez un produit avant d’ajouter au panier.');
      return;
    }

    if (this.form.controls.quantity.invalid) {
      this.form.controls.quantity.markAsDirty();
      this.form.controls.quantity.markAsTouched();
      return;
    }

    const quantity = this.form.controls.quantity.value;
    const unitPrice = selected.unitPrice;

    this.cart.update((lines) => {
      const existingIndex = lines.findIndex((line) => line.productId === selected.productId);
      if (existingIndex >= 0) {
        const updated = [...lines];
        const existingLine = updated[existingIndex];
        const newQuantity = existingLine.quantity + quantity;
        updated[existingIndex] = {
          ...existingLine,
          quantity: newQuantity,
          subtotal: this.lineSubtotal(existingLine.unitPrice, newQuantity),
        };
        return updated;
      }

      return [...lines, {
        productId: selected.productId,
        productLabel: selected.name,
        quantity,
        unitPrice,
        subtotal: this.lineSubtotal(unitPrice, quantity),
      }];
    });

    this.resetProductSelection();
  }

  removeFromCart(productId: string): void {
    this.cart.update((lines) => lines.filter((line) => line.productId !== productId));
  }

  onSubmit(formDirective: FormGroupDirective): void {
    if (this.isSubmitting) {
      return;
    }

    // Un produit sélectionné mais non ajouté : on demande confirmation plutôt
    // que de valider une vente incomplète ou d'ignorer silencieusement le choix.
    if (this.hasPendingProduct()) {
      this.confirmingPendingRemoval.set(true);
      return;
    }

    if (this.cart().length === 0) {
      this.notificationService.error('Ajoutez au moins un article au panier avant de valider la vente.');
      return;
    }

    const context = this.sessionContext.context();
    if (!context) {
      this.notificationService.error('Le contexte du magasin n\'est pas encore chargé. Réessayez.');
      return;
    }

    const request: CreateSaleRequest = {
      shopId: context.shopId,
      lines: this.cart().map((line) => ({ productId: line.productId, quantity: line.quantity })),
    };

    if (this.currentIdempotencyKey === null) {
      this.currentIdempotencyKey = crypto.randomUUID();
    }

    this.isSubmitting = true;

    this.salesApi.sellProduct(request, this.currentIdempotencyKey).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.currentIdempotencyKey = null;
        this.cart.set([]);
        this.notificationService.success('Vente enregistrée');
        formDirective.resetForm({ productId: '', quantity: 1 });
        this.resetProductSelection();
      },
      error: (error: unknown) => {
        this.isSubmitting = false;
        this.currentIdempotencyKey = null;
        this.notificationService.error(this.getSaleErrorMessage(error));
      },
    });
  }

  confirmPendingRemoval(): void {
    this.clearPendingSelection();
    this.confirmingPendingRemoval.set(false);
  }

  clearPendingSelection(): void {
    this.resetProductSelection();
  }

  private resetProductSelection(): void {
    this.form.controls.productId.setValue('');
    this.form.controls.quantity.setValue(1);
    this.preselectedLabel.set('');
    this.selectedProduct.set(null);
    this.picker()?.reset();
  }

  private lineSubtotal(unitPrice: Money, quantity: number): Money {
    return {
      amount: (Number(unitPrice.amount) * quantity).toString(),
      currency: unitPrice.currency,
    };
  }

  private getSaleErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Une erreur inattendue est survenue.';
    }

    const problem = error.error as Partial<ProblemDetail> | null;

    if (problem?.code === 'VALIDATION_FAILED') {
      return 'Certaines informations de la vente sont invalides.';
    }

    if (problem?.code === 'PRODUCT_NOT_FOUND') {
      return 'Le produit sélectionné est introuvable.';
    }

    if (problem?.code === 'STOCK_INSUFFICIENT') {
      return 'Le stock disponible est insuffisant pour cette vente.';
    }

    if (problem?.code === 'BUSINESS_RULE_VIOLATION') {
      return 'Une règle métier empêche l’enregistrement de la vente.';
    }

    return 'Impossible d\'enregistrer la vente pour le moment.';
  }
}
