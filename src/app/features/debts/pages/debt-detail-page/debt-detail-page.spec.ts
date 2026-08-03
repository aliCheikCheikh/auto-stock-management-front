import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebtDetailPage } from './debt-detail-page';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { CreditSaleDetailResponse } from '../../models/credit-sale-detail.model';
import { formatMoney } from '../../../../shared/pipes/money.pipe';
import { UNKNOWN_AUTHOR_LABEL } from '../../../../shared/utils/author';

const SALE_ID = 'sale-1';

function detail(overrides: Partial<CreditSaleDetailResponse> = {}): CreditSaleDetailResponse {
  return {
    saleId: SALE_ID,
    occurredAt: '2026-07-20T10:30:00',
    sellerId: 'user-1',
    sellerName: 'Ahmat',
    customerId: 'customer-1',
    customerGivenName: 'Moussa',
    customerFatherName: 'Youssouf',
    customerPhoneNumber: '+23566123456',
    lines: [
      {
        productId: 'product-1',
        productName: 'Plaquettes de frein',
        productReference: 'REF-42',
        quantity: 3,
        unitPrice: { amount: '40000', currency: 'XAF' },
        lineTotal: { amount: '120000', currency: 'XAF' },
      },
      {
        productId: 'product-2',
        productName: 'Filtre à huile',
        productReference: 'REF-08',
        quantity: 2,
        unitPrice: { amount: '40000', currency: 'XAF' },
        lineTotal: { amount: '80000', currency: 'XAF' },
      },
    ],
    totalAmount: { amount: '200000', currency: 'XAF' },
    amountPaid: { amount: '100000', currency: 'XAF' },
    amountDue: { amount: '100000', currency: 'XAF' },
    settled: false,
    payments: [
      {
        paymentId: 'payment-1',
        amount: { amount: '100000', currency: 'XAF' },
        receivedAt: '2026-07-20T10:30:00',
        receivedById: 'user-1',
        receivedByName: 'Ahmat',
      },
    ],
    ...overrides,
  };
}

describe('DebtDetailPage', () => {
  let component: DebtDetailPage;
  let fixture: ComponentFixture<DebtDetailPage>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebtDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['saleId', SALE_ID]]) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DebtDetailPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  function flush(response = detail()): void {
    httpTesting.expectOne(`/api/v1/debts/${SALE_ID}`).flush(response);
    fixture.detectChanges();
  }

  it('affiche les produits, les montants et l’échéancier', () => {
    flush();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(component.state()).toBe('success');
    expect(component.customerName()).toBe('Moussa Youssouf');
    expect(component.sellerName()).toBe('Ahmat');
    expect(text).toContain('Plaquettes de frein');
    expect(text).toContain('REF-42');
    expect(text).toContain('Filtre à huile');
    // Montants du serveur, jamais recalculés (formatage via MoneyPipe : les
    // séparateurs de milliers sont des espaces fines insécables).
    expect(text).toContain(formatMoney({ amount: '200000', currency: 'XAF' }));
    expect(text).toContain(formatMoney({ amount: '100000', currency: 'XAF' }));
    expect(text).toContain('Reçu par Ahmat');
  });

  it('nomme un encaisseur supprimé sans afficher « null »', () => {
    flush(
      detail({
        sellerName: null,
        payments: [
          {
            paymentId: 'payment-1',
            amount: { amount: '100000', currency: 'XAF' },
            receivedAt: '2026-07-20T10:30:00',
            receivedById: 'user-9',
            receivedByName: null,
          },
        ],
      })
    );

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(component.sellerName()).toBe(UNKNOWN_AUTHOR_LABEL);
    expect(text).toContain(UNKNOWN_AUTHOR_LABEL);
    expect(text).not.toContain('null');
  });

  it('se lit comme réglée quand la créance est soldée', () => {
    flush(
      detail({
        settled: true,
        amountPaid: { amount: '200000', currency: 'XAF' },
        amountDue: { amount: '0', currency: 'XAF' },
      })
    );

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Créance soldée');
    // Plus rien à encaisser : l'action disparaît.
    expect(text).not.toContain('Encaisser un remboursement');
  });

  it('explique clairement une vente au comptant (404)', () => {
    httpTesting
      .expectOne(`/api/v1/debts/${SALE_ID}`)
      .flush({ code: 'SALE_NOT_FOUND' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(component.state()).toBe('not-found');
    expect(text).toContain('Cette vente n’est pas une créance');
    expect(text).toContain('Retour aux créances');
  });

  it('recharge le détail après un encaissement', () => {
    flush();

    component.onPaymentRecorded({
      saleId: SALE_ID,
      amountPaid: { amount: '100000', currency: 'XAF' },
      receivedAt: '2026-07-30T09:00:00',
      totalAmount: { amount: '200000', currency: 'XAF' },
      totalCollected: { amount: '200000', currency: 'XAF' },
      amountDue: { amount: '0', currency: 'XAF' },
      settled: true,
    });

    expect(component.isPaymentOpen()).toBeFalse();
    flush(
      detail({
        settled: true,
        amountDue: { amount: '0', currency: 'XAF' },
        amountPaid: { amount: '200000', currency: 'XAF' },
      })
    );

    expect(component.detail()?.settled).toBeTrue();
  });
});
