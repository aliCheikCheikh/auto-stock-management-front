import { Component, inject, OnInit } from '@angular/core';
import { ProductsApiService } from '../../data-access/products-api.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-product-edit-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-edit-page.html',
  styleUrl: './product-edit-page.scss',
})
export class ProductEditPage implements OnInit {
  private readonly productsApi = inject(ProductsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private productId!: string;
  isSubmitting = false;

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    unitPrice: new FormGroup({
      amount: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      currency: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    }),
    minimumGlobalThreshold: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
  });

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('productId');
    if (productId === null) {
      return;
    }
    this.productId = productId;

    this.productsApi.getProduct(productId).subscribe({
      next: (product) => {
        this.form.patchValue({
          name: product.name,
          unitPrice: { amount: product.unitPrice.amount, currency: product.unitPrice.currency },
          minimumGlobalThreshold: product.minimumGlobalThreshold,
        });
      },
      error: () => {
        this.notifications.error('Produit introuvable');
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

    const request = this.form.getRawValue();
    this.isSubmitting = true;

    this.productsApi.updateProduct(this.productId, request).subscribe({
      next: (product) => {
        this.notifications.success(`Le produit « ${product.name} » a été mis à jour.`);
        this.isSubmitting = false;
        this.router.navigate(['/products', this.productId])

      },
      error: () => {
        this.notifications.error('La mise à jour du produit a échoué');
        this.isSubmitting = false;
      }
    })
  }

}
