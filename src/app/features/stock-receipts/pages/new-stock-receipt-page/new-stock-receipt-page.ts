import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReceiveStockRequest } from '../../models/stock-receipt.model';
import { DEV_SESSION_CONTEXT } from '../../../../core/dev-session-context';
import { StockReceiptsApiService } from '../../data-access/stock-receipts-api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../../../../core/api/problem-detail.model';

@Component({
  selector: 'app-new-stock-receipt-page',
  imports: [ReactiveFormsModule],
  templateUrl: './new-stock-receipt-page.html',
  styleUrl: './new-stock-receipt-page.scss',
})
export class NewStockReceiptPage {
  private readonly stockReceiptsApi = inject(StockReceiptsApiService);

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  readonly form = new FormGroup({
    productReference: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    productName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    categoryId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    unitPriceAmount: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    minimumGlobalThreshold: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    shopFloorQuantity: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    backstockQuantity: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
  });



  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    const totalReceived = formValue.shopFloorQuantity + formValue.backstockQuantity;
    if (totalReceived <= 0) {
      this.form.controls.shopFloorQuantity.markAllAsTouched();
      this.form.controls.backstockQuantity.markAllAsTouched();
      return;
    }

    const request: ReceiveStockRequest = {
      productReference: formValue.productReference,
      newProductInfo: {
        name: formValue.productName,
        reference: formValue.productReference,
        categoryId: formValue.categoryId,
        unitPrice: {
          amount: formValue.unitPriceAmount,
          currency: 'EUR',
        },
        minimumGlobalThreshold: formValue.minimumGlobalThreshold,
      },
      shopId: DEV_SESSION_CONTEXT.shopId,
      userId: DEV_SESSION_CONTEXT.userId,
      distributions: [
        {
          locationId: DEV_SESSION_CONTEXT.locations.shopFloor.locationId,
          quantity: formValue.shopFloorQuantity,
        },
        {
          locationId: DEV_SESSION_CONTEXT.locations.backstock.locationId,
          quantity: formValue.backstockQuantity,
        },
      ].filter((distribution) => distribution.quantity > 0),
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.stockReceiptsApi.receiveStock(request).subscribe({
      next: (acknowledgement) => {
        this.isSubmitting = false;
        this.successMessage = `Reception enregistrée : ${acknowledgement.totalReceived} pièce(s)`;
      },
      error: (error: unknown) => {
        this.isSubmitting = false;
        this.errorMessage = this.getReceiptErrorMessage(error);

      },
    })

  }

  private getReceiptErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Erreur inattendue pendant l’enregistrement.';
    }

    const problem = error.error as Partial<ProblemDetail> | null;

    switch (problem?.code) {
      case 'VALIDATION_FAILED':
        return 'Certaines informations de la réception sont invalides.';

      case 'PRODUCT_NOT_FOUND':
        return 'Le produit n’existe pas encore ou la référence est incorrecte.';

      case 'LOCATION_NOT_FOUND':
        return 'Un emplacement de réception est introuvable.';

      case 'BUSINESS_RULE_VIOLATION':
        return 'La réception ne respecte pas une règle métier.';

      default:
        return 'Impossible d’enregistrer la réception pour le moment.';
    }
  }
}
