import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { SalesApiService } from '../../data-access/sales-api.service';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateSaleRequest } from '../../models/sales.model';
import { SessionContextService } from '../../../../core/session/session-context.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../../../../core/api/problem-detail.model';
import { ProductsApiService } from '../../../products/data-access/products-api.service';
import { ProductSearchResult } from '../../../products/models/product.model';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { ActivatedRoute } from '@angular/router';
import { ProductPicker } from '../../../products/ui/product-picker/product-picker';

@Component({
  selector: 'app-new-sale-page',
  imports: [ReactiveFormsModule, ProductPicker],
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

  readonly form = new FormGroup({
    productId: new FormControl('',
      {
        nonNullable: true,
        validators: [Validators.required]
      }),
    quantity: new FormControl(1,
      {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)]
      }),
  });

  ngOnInit(): void {
    // Charge le contexte magasin (shopId réel) une fois, mis en cache.
    this.sessionContext.ensureLoaded().subscribe({
      error: () => this.notificationService.error('Impossible de charger le contexte du magasin.'),
    });

    // Pré-sélection éventuelle depuis la fiche produit (?productId=…) : on
    // récupère le produit pour renseigner le contrôle et afficher son nom.
    const productId = this.route.snapshot.queryParamMap.get('productId');
    if (productId) {
      this.productsApi.getProduct(productId).subscribe({
        next: (product) => {
          this.form.controls.productId.setValue(product.productId);
          this.preselectedLabel.set(product.name);
        },
        error: () => this.notificationService.error('Le produit pré-sélectionné est introuvable.'),
      });
    }
  }

  // Le picker n'est pas un contrôle de formulaire : on reporte le choix dans le
  // contrôle productId (source de vérité pour la validation et la requête).
  onProductSelected(product: ProductSearchResult): void {
    this.form.controls.productId.setValue(product.productId);
    this.form.controls.productId.markAsDirty();
    this.form.controls.productId.markAsTouched();
  }

  onSubmit(formDirective: FormGroupDirective): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const context = this.sessionContext.context();
    if (!context) {
      this.notificationService.error('Le contexte du magasin n\'est pas encore chargé. Réessayez.');
      return;
    }

    const formValue = this.form.getRawValue();

    const request: CreateSaleRequest = {
      shopId: context.shopId,
      lines: [
        {
          productId: formValue.productId,
          quantity: formValue.quantity,
        }
      ].filter((line) => line.quantity > 0)
    };

    if (this.currentIdempotencyKey === null) {
      this.currentIdempotencyKey = crypto.randomUUID();
    }

    this.isSubmitting = true;

    this.salesApi.sellProduct(request, this.currentIdempotencyKey).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.currentIdempotencyKey = null;
        this.notificationService.success('Vente enregistrée');
        // resetForm() remet aussi submitted=false → aucune erreur ne reflashe.
        formDirective.resetForm({ productId: '', quantity: 1 });
        // Vide aussi l'affichage du picker (non lié au FormGroup).
        this.preselectedLabel.set('');
        this.picker()?.reset();
      },
      error: (error: unknown) => {
        this.isSubmitting = false;
        this.currentIdempotencyKey = null;
        this.notificationService.error(this.getSaleErrorMessage(error));
      }
    })

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


