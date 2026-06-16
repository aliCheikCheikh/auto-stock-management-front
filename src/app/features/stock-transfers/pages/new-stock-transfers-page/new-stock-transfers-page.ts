import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { StockTransfersApiService } from '../../data-access/stock-transfers-api.service';
import { TransferStockRequest } from '../../models/stock-transfers.model';
import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../../../../core/api/problem-detail.model';
import { DEV_SESSION_CONTEXT } from '../../../../core/dev-session-context';
import { Product } from '../../../products/models/product.model';
import { ProductsApiService } from '../../../products/data-access/products-api.service';
import { NotificationService } from '../../../../core/notifications/notification.service';

@Component({
  selector: 'app-new-stock-transfers-page',
  imports: [ReactiveFormsModule],
  templateUrl: './new-stock-transfers-page.html',
  styleUrl: './new-stock-transfers-page.scss',
})
export class NewStockTransfersPage implements OnInit {
  private readonly stockTransfersApi = inject(StockTransfersApiService);
  private readonly productsApi = inject(ProductsApiService);
  private readonly notificationService = inject(NotificationService);

  products: readonly Product[] = [];
  readonly locations = [
    DEV_SESSION_CONTEXT.locations.shopFloor,
    DEV_SESSION_CONTEXT.locations.backstock,
  ];

  isSubmitting = false;

  currentIdempotencyKey: string | null = null;

  readonly form = new FormGroup({
    productId: new FormControl('',
      {
        nonNullable: true,
        validators: [Validators.required]
      }),

    sourceLocationId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),

    destinationLocationId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),

    quantity: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)]
    }),

  }, { validators: differentLocationsValidator });


  ngOnInit(): void {
    this.productsApi.listProducts().subscribe({
      next: (page) => {
        this.products = page.content;
      }
    })
  }


  onSubmit(formDirective: FormGroupDirective): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();


    const request: TransferStockRequest = {
      productId: formValue.productId,
      sourceLocationId: formValue.sourceLocationId,
      destinationLocationId: formValue.destinationLocationId,
      quantity: formValue.quantity,
      userId: DEV_SESSION_CONTEXT.userId,
    };

    if (this.currentIdempotencyKey === null) {
      this.currentIdempotencyKey = crypto.randomUUID();
    }

    this.isSubmitting = true;


    this.stockTransfersApi.transferStock(request, this.currentIdempotencyKey).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.currentIdempotencyKey = null;
        this.notificationService.success('Transfert effectué');
        // resetForm() remet aussi submitted=false → aucune erreur ne reflashe.
        formDirective.resetForm({
          productId: '',
          sourceLocationId: '',
          destinationLocationId: '',
          quantity: 1,
        });
      },
      error: (error: unknown) => {
        this.isSubmitting = false;
        this.notificationService.error(this.getTransferErrorMessage(error));
      }
    });
  }

  private getTransferErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Une erreur inattendue est survenue.';
    }

    const problem = error.error as Partial<ProblemDetail> | null;

    if (problem?.code === 'VALIDATION_FAILED') {
      return 'Certaines informations du transfert sont invalides.';
    }

    if (problem?.code === 'PRODUCT_NOT_FOUND') {
      return 'Le produit spécifié est introuvable.';
    }

    if (problem?.code === 'LOCATION_NOT_FOUND') {
      return 'L’un des emplacements spécifiés est introuvable.';
    }

    if (problem?.code === 'INVALID_TRANSFER') {
      return 'Le transfert demandé est invalide. Veuillez vérifier les informations saisies.';
    }

    if (problem?.code === 'STOCK_INSUFFICIENT') {
      return 'Stock insuffisant dans l’emplacement source pour réaliser ce transfert.';
    }

    if (problem?.code === 'BUSINESS_RULE_VIOLATION') {
      return 'Une règle métier empêche la réalisation de ce transfert.';
    }

    return 'Erreur lors du transfert de stock. Veuillez réessayer.';


  }

}

function differentLocationsValidator(group: AbstractControl): ValidationErrors | null {
  const sourceLocationId = group.get('sourceLocationId')?.value;
  const destinationLocationId = group.get('destinationLocationId')?.value;

  if (sourceLocationId && destinationLocationId && sourceLocationId === destinationLocationId) {
    return { sameLocation: true };
  }
  return null;

}
