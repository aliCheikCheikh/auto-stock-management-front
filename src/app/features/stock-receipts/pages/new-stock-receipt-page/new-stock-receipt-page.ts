import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReceiveStockRequest } from '../../models/stock-receipt.model';
import { DEV_SESSION_CONTEXT } from '../../../../core/dev-session-context';

@Component({
  selector: 'app-new-stock-receipt-page',
  imports: [ReactiveFormsModule],
  templateUrl: './new-stock-receipt-page.html',
  styleUrl: './new-stock-receipt-page.scss',
})
export class NewStockReceiptPage {
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
    quantity: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
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
          locationId: DEV_SESSION_CONTEXT.defaultLocationId,
          quantity: formValue.quantity,
        },
      ],
    }
    console.log(request);

  }
}
