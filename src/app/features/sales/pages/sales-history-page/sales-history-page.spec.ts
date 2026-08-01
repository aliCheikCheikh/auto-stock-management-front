import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { SalesHistoryPage } from './sales-history-page';
import { SaleResponse } from '../../models/sales.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { signal } from '@angular/core';

function sale(overrides: Partial<SaleResponse> = {}): SaleResponse {
  return {
    saleId: 'sale-1',
    sellerId: 'user-1',
    sellerName: 'Ahmat',
    createdAt: '2026-07-20T10:30:00',
    totalAmount: { amount: '50000.00', currency: 'XAF' },
    lines: [
      {
        productId: 'product-1',
        quantity: 2,
        unitPrice: { amount: '25000.00', currency: 'XAF' },
        subtotal: { amount: '50000.00', currency: 'XAF' },
      },
    ],
    ...overrides,
  };
}

describe('SalesHistoryPage', () => {
  let fixture: ComponentFixture<SalesHistoryPage>;
  let httpTesting: HttpTestingController;

  function setUp(role: 'OWNER' | 'SELLER' = 'OWNER'): void {
    TestBed.configureTestingModule({
      imports: [SalesHistoryPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { currentUser: signal({ userId: 'user-1', role }) },
        },
      ],
    });

    fixture = TestBed.createComponent(SalesHistoryPage);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpTesting
      .expectOne((request) => request.url === '/api/v1/products')
      .flush({ content: [], page: { page: 0, size: 200, totalElements: 0, totalPages: 0 } });
  }

  function salesRequest(): TestRequest {
    return httpTesting.expectOne((request) => request.url === '/api/v1/sales');
  }

  function flushSales(content: SaleResponse[]): void {
    salesRequest().flush({
      content,
      page: { page: 0, size: 10, totalElements: content.length, totalPages: 1 },
    });
    fixture.detectChanges();
  }

  afterEach(() => httpTesting.verify());

  it('signale une vente réglée', () => {
    setUp();
    flushSales([sale({ amountDue: { amount: '0.00', currency: 'XAF' } })]);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Payée');
  });

  it('signale une vente à crédit et ouvre la créance', () => {
    setUp();
    flushSales([sale({ amountDue: { amount: '30000.00', currency: 'XAF' } })]);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('À crédit');
    expect(element.querySelector('a.settlement-badge--credit')?.getAttribute('href')).toBe(
      '/creances/sale-1'
    );
  });

  it('n’affiche aucun repère quand le serveur ne renvoie pas de solde', () => {
    setUp();
    flushSales([sale()]);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.settlement-badge')).toBeNull();
  });

  it('ne propose pas le lien vers la créance à un vendeur', () => {
    setUp('SELLER');
    flushSales([sale({ amountDue: { amount: '30000.00', currency: 'XAF' } })]);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('À crédit');
    expect(element.querySelector('a.settlement-badge--credit')).toBeNull();
  });
});
