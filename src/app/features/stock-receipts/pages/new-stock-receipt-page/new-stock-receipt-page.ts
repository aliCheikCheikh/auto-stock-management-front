import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-new-stock-receipt-page',
  imports: [ReactiveFormsModule],
  templateUrl: './new-stock-receipt-page.html',
  styleUrl: './new-stock-receipt-page.scss',
})
export class NewStockReceiptPage {
  readonly form = new FormGroup({
    productReference: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
}
