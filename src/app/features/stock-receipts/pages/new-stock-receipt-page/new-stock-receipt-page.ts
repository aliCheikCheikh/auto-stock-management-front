import { Component,inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReceiveStockRequest } from '../../models/stock-receipt.model';
import { DEV_SESSION_CONTEXT } from '../../../../core/dev-session-context';
import { StockReceiptsApiService } from '../../data-access/stock-receipts-api.service';

@Component({
  selector: 'app-new-stock-receipt-page',
  imports: [ReactiveFormsModule],
  templateUrl: './new-stock-receipt-page.html',
  styleUrl: './new-stock-receipt-page.scss',
})
export class NewStockReceiptPage {
  private readonly stockReceiptsApi = inject(StockReceiptsApiService);
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
    this.stockReceiptsApi.receiveStock(request).subscribe({
      next: (acknowledgement) => {
        console.log('Stock receipt acknowledged:', acknowledgement);
        alert(`Stock receipt acknowledged for product ID: ${acknowledgement.productId}, total received: ${acknowledgement.totalReceived}`);
      },
      error: (error) => {
        console.error('Error receiving stock:', error);
        alert('An error occurred while receiving stock. Please try again.');
      },
    })

  }
}
