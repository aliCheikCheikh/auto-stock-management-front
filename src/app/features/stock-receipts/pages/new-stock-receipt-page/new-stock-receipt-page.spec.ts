import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { SessionContextService } from '../../../../core/session/session-context.service';
import { CategoriesApiService } from '../../../categories/data-access/categories-api.service';
import { ProductsApiService } from '../../../products/data-access/products-api.service';
import { StockReceiptsApiService } from '../../data-access/stock-receipts-api.service';
import { NewStockReceiptPage } from './new-stock-receipt-page';

describe('NewStockReceiptPage', () => {
  let fixture: ComponentFixture<NewStockReceiptPage>;
  let productsApi: jasmine.SpyObj<ProductsApiService>;

  beforeEach(async () => {
    productsApi = jasmine.createSpyObj<ProductsApiService>('ProductsApiService', [
      'getProduct',
      'searchProducts',
    ]);
    productsApi.getProduct.and.returnValue(
      of({
        productId: 'product-1',
        name: 'Alternateur',
        reference: 'ALT-001',
        categoryId: 'category-1',
        unitPrice: { amount: '25000', currency: 'XAF' },
        minimumGlobalThreshold: 4,
      })
    );

    const sessionContext = jasmine.createSpyObj<SessionContextService>('SessionContextService', [
      'ensureLoaded',
      'context',
      'locationIdByType',
    ]);
    sessionContext.ensureLoaded.and.returnValue(
      of({ shopId: 'shop-1', locations: [] })
    );

    const categoriesApi = jasmine.createSpyObj<CategoriesApiService>('CategoriesApiService', [
      'listCategories',
    ]);
    categoriesApi.listCategories.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [NewStockReceiptPage],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ productId: 'product-1' }) },
          },
        },
        { provide: ProductsApiService, useValue: productsApi },
        { provide: SessionContextService, useValue: sessionContext },
        { provide: CategoriesApiService, useValue: categoriesApi },
        {
          provide: StockReceiptsApiService,
          useValue: jasmine.createSpyObj<StockReceiptsApiService>('StockReceiptsApiService', [
            'receiveStock',
          ]),
        },
        {
          provide: NotificationService,
          useValue: jasmine.createSpyObj<NotificationService>('NotificationService', [
            'success',
            'error',
            'info',
          ]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewStockReceiptPage);
    fixture.detectChanges();
  });

  it('préremplit le produit demandé par le dashboard sans toucher aux quantités', () => {
    const component = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;

    expect(productsApi.getProduct).toHaveBeenCalledOnceWith('product-1');
    expect(component.form.controls.isNewProduct.value).toBeFalse();
    expect(component.form.controls.productReference.value).toBe('ALT-001');
    expect(component.form.controls.shopFloorQuantity.value).toBe(0);
    expect(component.form.controls.backstockQuantity.value).toBe(0);
    expect(root.textContent).toContain('Saisissez seulement les quantités reçues');
  });
});
