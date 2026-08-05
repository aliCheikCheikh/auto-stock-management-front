import { Component, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReceiveStockRequest } from '../../models/stock-receipt.model';
import { SessionContextService } from '../../../../core/session/session-context.service';
import { StockReceiptsApiService } from '../../data-access/stock-receipts-api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../../../../core/api/problem-detail.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { CategoriesApiService } from '../../../categories/data-access/categories-api.service';
import { Category } from '../../../categories/models/category.model';
import { ProductsApiService } from '../../../products/data-access/products-api.service';
import { ProductSearchResult } from '../../../products/models/product.model';
import { ActivatedRoute, CanDeactivateFn } from '@angular/router';
import { ProductPicker } from '../../../products/ui/product-picker/product-picker';
import { StockReceiptImport } from '../../ui/stock-receipt-import/stock-receipt-import';

@Component({
  selector: 'app-new-stock-receipt-page',
  imports: [ReactiveFormsModule, ProductPicker, StockReceiptImport],
  templateUrl: './new-stock-receipt-page.html',
  styleUrl: './new-stock-receipt-page.scss',
})
export class NewStockReceiptPage {
  private readonly stockReceiptsApi = inject(StockReceiptsApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly categoriesApi = inject(CategoriesApiService);
  categories:Category[] = [];
  private readonly productsApi = inject(ProductsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly sessionContext = inject(SessionContextService);

  // Libellé pré-rempli du picker « produit existant » (pré-sélection fiche).
  readonly preselectedLabel = signal('');
  private readonly picker = viewChild(ProductPicker);

  isSubmitting = false;
  currentIdempotencyKey: string | null = null;
  receiptMethod: 'manual' | 'csv' = 'manual';
  importSafetyLocked = false;

  selectReceiptMethod(method: 'manual' | 'csv'): void {
    if (this.importSafetyLocked && method !== 'csv') {
      this.notificationService.info('Terminez ou réessayez l’import en cours avant de changer de méthode.');
      return;
    }
    this.receiptMethod = method;
  }

  onImportSafetyLockChange(locked: boolean): void {
    this.importSafetyLocked = locked;
  }

  canLeavePage(): boolean {
    if (!this.importSafetyLocked) {
      return true;
    }
    this.notificationService.info('Attendez le rapport ou réessayez l’import avant de quitter cette page.');
    return false;
  }

  constructor() {
    // Charge le contexte magasin (shopId + emplacements réels) une fois, en cache.
    this.sessionContext.ensureLoaded().pipe(takeUntilDestroyed()).subscribe({
      error: () => this.notificationService.error('Impossible de charger le contexte du magasin.'),
    });

    this.updateProductInfoValidators(this.form.controls.isNewProduct.value);

    this.form.controls.isNewProduct.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((isNewProduct) => {
        this.updateProductInfoValidators(isNewProduct);
        // Au changement de mode, on repart d'une référence vierge : évite qu'une
        // valeur saisie/choisie dans l'autre mode ne reste collée dans le champ.
        this.form.controls.productReference.reset('');
        this.preselectedLabel.set('');
      });
      this.categoriesApi.listCategories().pipe(takeUntilDestroyed()).subscribe((categories)=>{
        this.categories = categories;
      })

      // Pré-sélection éventuelle depuis la fiche produit (?productId=…) : bascule
      // en mode « produit existant » et renseigne la référence + le libellé.
      const productId = this.route.snapshot.queryParamMap.get('productId');
      if (productId) {
        this.form.controls.isNewProduct.setValue(false);
        this.productsApi.getProduct(productId).pipe(takeUntilDestroyed()).subscribe({
          next: (product) => {
            this.form.controls.productReference.setValue(product.reference);
            this.preselectedLabel.set(product.name);
          },
          error: () => this.notificationService.error('Le produit pré-sélectionné est introuvable.'),
        });
      }
  }

  // Reporte la sélection du picker dans le contrôle productReference (le
  // back-end réceptionne un produit existant par sa référence).
  onProductSelected(product: ProductSearchResult): void {
    this.form.controls.productReference.setValue(product.reference);
    this.form.controls.productReference.markAsDirty();
    this.form.controls.productReference.markAsTouched();
  }

  readonly form = new FormGroup({
    isNewProduct: new FormControl(true, { nonNullable: true }),
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
    backstockQuantity: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
  });



  onSubmit(formDirective: FormGroupDirective): void {

    if (this.isSubmitting) {
      return
    }

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

    const context = this.sessionContext.context();
    const shopFloorId = this.sessionContext.locationIdByType('SHOP_FLOOR');
    const backstockId = this.sessionContext.locationIdByType('BACKSTOCK');
    if (!context || !shopFloorId || !backstockId) {
      this.notificationService.error('Le contexte du magasin n\'est pas encore chargé. Réessayez.');
      return;
    }

    const request: ReceiveStockRequest = {
      productReference: formValue.productReference,
      ...(formValue.isNewProduct ? {
        newProductInfo: {
          name: formValue.productName,
          reference: formValue.productReference,
          categoryId: formValue.categoryId,
          unitPrice: {
            amount: formValue.unitPriceAmount,
            currency: 'XAF'
          },
          minimumGlobalThreshold: formValue.minimumGlobalThreshold,
        },
      } : {}),
      shopId: context.shopId,
      distributions: [
        {
          locationId: shopFloorId,
          quantity: formValue.shopFloorQuantity,
        },
        {
          locationId: backstockId,
          quantity: formValue.backstockQuantity,
        },
      ].filter((distribution) => distribution.quantity > 0),
    }


    if (this.currentIdempotencyKey === null) {
      this.currentIdempotencyKey = crypto.randomUUID();
    }

    this.isSubmitting = true;

    this.stockReceiptsApi.receiveStock(request, this.currentIdempotencyKey).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.currentIdempotencyKey = null;
        this.notificationService.success('Réception enregistrée');
        // resetForm() avec les valeurs initiales : champs vierges, pristine,
        // untouched ET submitted=false → pas d'erreur "requis" qui reflashe.
        formDirective.resetForm({
          isNewProduct: true,
          productReference: '',
          productName: '',
          categoryId: '',
          unitPriceAmount: '',
          minimumGlobalThreshold: 0,
          shopFloorQuantity: 0,
          backstockQuantity: 0,
        });
        // Le picker n'est pas un contrôle du formulaire : on le vide à la main.
        this.preselectedLabel.set('');
        this.picker()?.reset();
      },
      error: (error: unknown) => {
        this.isSubmitting = false;
        // Une soumission corrigée est une NOUVELLE opération → clé neuve
        // (sinon « même clé, corps différent » = 422 IDEMPOTENCY_KEY_REUSED).
        this.currentIdempotencyKey = null;
        this.notificationService.error(this.getReceiptErrorMessage(error));
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

      case 'PRODUCT_REFERENCE_ALREADY_USED':
        return 'Cette référence est déjà utilisée par un produit existant.';

      case 'PRODUCT_NAME_ALREADY_USED':
        return 'Ce nom est déjà utilisé par un produit existant.';

      case 'BUSINESS_RULE_VIOLATION':
        return 'La réception ne respecte pas une règle métier.';

      default:
        return 'Impossible d’enregistrer la réception pour le moment.';
    }
  }

  private updateProductInfoValidators(isNewProduct: boolean): void {
    const productNameValidators = isNewProduct ? [Validators.required] : [];
    const categoryIdValidators = isNewProduct ? [Validators.required] : [];
    const unitPriceValidators = isNewProduct ? [Validators.required] : [];
    const minimumGlobalThresholdValidators = isNewProduct ? [Validators.required, Validators.min(0)] : [];



    this.form.controls.productName.setValidators(productNameValidators);
    this.form.controls.categoryId.setValidators(categoryIdValidators);
    this.form.controls.unitPriceAmount.setValidators(unitPriceValidators);
    this.form.controls.minimumGlobalThreshold.setValidators(minimumGlobalThresholdValidators);

    this.form.controls.productName.updateValueAndValidity();
    this.form.controls.categoryId.updateValueAndValidity();
    this.form.controls.unitPriceAmount.updateValueAndValidity();
    this.form.controls.minimumGlobalThreshold.updateValueAndValidity();
  }
}

export const pendingStockReceiptImportGuard: CanDeactivateFn<NewStockReceiptPage> = (page) =>
  page.canLeavePage();
