import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { SalesApiService } from '../../data-access/sales-api.service';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateSaleRequest } from '../../models/sales.model';
import { CartLine, CartQuantityChange } from '../../models/cart-line.model';
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
import { formatMoney } from '../../../../shared/pipes/money.pipe';
import { SaleCart } from '../../ui/sale-cart/sale-cart';
import { PaymentMode, PaymentPanel, sanitizeAmount } from '../../ui/payment-panel/payment-panel';
import { CustomerResponse } from '../../../customers/models/customer.model';
import { addAmounts, isPositiveAmount, multiplyAmount } from '../../../../shared/utils/money-math';

interface PendingProduct {
  productId: string;
  label: string;
  unitPrice: Money;
}

/**
 * Écran de vente — orchestration seulement : le panier (`SaleCart`) et le bloc
 * paiement (`PaymentPanel`) sont des composants dédiés. La page tient l'état du
 * panier, celui du paiement et la soumission.
 */
@Component({
  selector: 'app-new-sale-page',
  imports: [ReactiveFormsModule, ProductPicker, SaleCart, PaymentPanel, ConfirmDialog],
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
  private readonly paymentPanel = viewChild(PaymentPanel);

  currentIdempotencyKey: string | null = null;
  readonly isSubmitting = signal(false);
  readonly cart = signal<CartLine[]>([]);
  readonly confirmingPendingRemoval = signal(false);

  // Guidage de saisie affiché près du champ concerné. Une saisie incomplète
  // n'est pas un échec : elle ne déclenche pas de toast rouge, qui dévaluerait
  // les vraies alertes (vente refusée, appel serveur en erreur).
  readonly entryHint = signal('');

  // Source de vérité unique : le produit sélectionné mais pas encore ajouté au
  // panier. Renseigné par le picker ou la pré-sélection, remis à null à l'ajout.
  readonly selectedProduct = signal<ProductSearchResult | null>(null);

  // État du paiement, piloté en liaison double par PaymentPanel.
  readonly paymentMode = signal<PaymentMode>('FULL');
  readonly amountPaid = signal('0');
  readonly customer = signal<CustomerResponse | null>(null);

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
    const lines = this.cart();
    const amount = lines.reduce((sum, line) => addAmounts(sum, line.subtotal.amount), '0');
    return { amount, currency: lines[0]?.unitPrice.currency ?? 'XAF' };
  });

  readonly isCreditSale = computed(() => this.paymentMode() === 'CREDIT');
  readonly missingCustomer = computed(() => this.isCreditSale() && this.customer() === null);
  readonly canSubmit = computed(() => this.cart().length > 0 && !this.missingCustomer());

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
    this.entryHint.set('');
  }

  addToCart(): void {
    const selected = this.selectedProduct();
    if (!selected) {
      this.entryHint.set('Choisissez d’abord un produit dans le champ ci-dessus.');
      this.picker()?.focus();
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
          subtotal: lineSubtotal(existingLine.unitPrice, newQuantity),
        };
        return updated;
      }

      return [...lines, {
        productId: selected.productId,
        productLabel: selected.name,
        quantity,
        unitPrice,
        subtotal: lineSubtotal(unitPrice, quantity),
      }];
    });

    this.entryHint.set('');
    this.resetProductSelection();
    // Enchaînement clavier : le champ produit reprend la main.
    this.picker()?.focus();
  }

  // Entrée depuis le champ quantité : ajoute la ligne sans soumettre la vente.
  onQuantityEnter(event: Event): void {
    event.preventDefault();
    this.addToCart();
  }

  updateQuantity(change: CartQuantityChange): void {
    this.cart.update((lines) =>
      lines.map((line) =>
        line.productId === change.productId
          ? {
              ...line,
              quantity: change.quantity,
              subtotal: lineSubtotal(line.unitPrice, change.quantity),
            }
          : line
      )
    );
  }

  removeFromCart(productId: string): void {
    this.cart.update((lines) => lines.filter((line) => line.productId !== productId));
  }

  onSubmit(formDirective: FormGroupDirective): void {
    if (this.isSubmitting()) {
      return;
    }

    // Un produit sélectionné mais non ajouté : on demande confirmation plutôt
    // que de valider une vente incomplète ou d'ignorer silencieusement le choix.
    if (this.hasPendingProduct()) {
      this.confirmingPendingRemoval.set(true);
      return;
    }

    // Panier vide et client manquant sont déjà expliqués sous le bouton (qui
    // est désactivé) : on ramène le vendeur au champ utile, sans alerte.
    if (this.cart().length === 0) {
      this.entryHint.set('Ajoutez au moins un article avant de valider la vente.');
      this.picker()?.focus();
      return;
    }

    const context = this.sessionContext.context();
    if (!context) {
      this.notificationService.error('Le contexte du magasin n\'est pas encore chargé. Réessayez.');
      return;
    }

    const customer = this.customer();
    if (this.isCreditSale() && customer === null) {
      this.paymentPanel()?.focusCustomer();
      return;
    }

    const request: CreateSaleRequest = {
      shopId: context.shopId,
      lines: this.cart().map((line) => ({ productId: line.productId, quantity: line.quantity })),
      // Vente au comptant : aucun des deux champs n'est envoyé.
      ...(this.isCreditSale() && customer
        ? {
            customerId: customer.customerId,
            // Seule conversion numérique : le contrat d'API attend un nombre nu.
            amountPaid: Number(sanitizeAmount(this.amountPaid())),
          }
        : {}),
    };

    if (this.currentIdempotencyKey === null) {
      this.currentIdempotencyKey = crypto.randomUUID();
    }

    this.isSubmitting.set(true);

    this.salesApi.sellProduct(request, this.currentIdempotencyKey).subscribe({
      next: (sale) => {
        this.isSubmitting.set(false);
        this.currentIdempotencyKey = null;
        this.cart.set([]);
        // Le solde annoncé au client est celui du backend, pas le calcul local.
        const amountDue = sale.amountDue;
        this.notificationService.success(
          amountDue && isPositiveAmount(amountDue.amount)
            ? `Vente enregistrée — reste à payer : ${formatMoney(amountDue)}`
            : 'Vente enregistrée'
        );
        formDirective.resetForm({ productId: '', quantity: 1 });
        this.resetProductSelection();
        this.paymentPanel()?.reset();
        this.picker()?.focus();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
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

    if (problem?.code === 'CREDIT_SALE_REQUIRES_CUSTOMER') {
      return 'Une vente à crédit doit être rattachée à un client.';
    }

    if (problem?.code === 'CUSTOMER_NOT_FOUND') {
      return 'Le client sélectionné est introuvable.';
    }

    return 'Impossible d\'enregistrer la vente pour le moment.';
  }
}

function lineSubtotal(unitPrice: Money, quantity: number): Money {
  return {
    amount: multiplyAmount(unitPrice.amount, quantity),
    currency: unitPrice.currency,
  };
}
