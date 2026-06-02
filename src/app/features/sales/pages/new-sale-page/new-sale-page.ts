import { Component, inject, OnInit } from '@angular/core';
import { SalesApiService } from '../../data-access/sales-api.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateSaleRequest } from '../../models/sales.model';
import { DEV_SESSION_CONTEXT } from '../../../../core/dev-session-context';
import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../../../../core/api/problem-detail.model';
import { ProductsApiService } from '../../../products/data-access/products-api.service';
import { Product } from '../../../products/models/product.model';

@Component({
  selector: 'app-new-sale-page',
  imports: [ReactiveFormsModule],
  templateUrl: './new-sale-page.html',
  styleUrl: './new-sale-page.scss',
})
export class NewSalePage implements OnInit {
  private readonly salesApi = inject(SalesApiService);
  private readonly productsApi = inject(ProductsApiService);
  products: readonly Product[] = [];

  currentIdempotencyKey: string | null = null;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

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
    this.productsApi.listProducts().subscribe({
      next: (page) => {
        this.products = page.content;
      }
    })
  }

  onSubmit(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    const request: CreateSaleRequest = {
      sellerId: DEV_SESSION_CONTEXT.userId,
      shopId: DEV_SESSION_CONTEXT.shopId,
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
    this.successMessage = '';
    this.errorMessage = '';

    this.salesApi.sellProduct(request, this.currentIdempotencyKey).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.currentIdempotencyKey = null;
        this.successMessage = `Vente enregistrée (ID: ${response.saleId})`;
      },
      error: (error: unknown) => {
        this.isSubmitting = false;
        this.errorMessage = this.getSaleErrorMessage(error);
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


