import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { CustomerDebtsPage } from './customer-debts-page';
import { DebtResponse } from '../../../debts/models/debt.model';
import { Page } from '../../../../core/api/page.model';

const CUSTOMER_ID = 'customer-1';

function debt(overrides: Partial<DebtResponse> = {}): DebtResponse {
  return {
    saleId: 'sale-1',
    occurredAt: '2026-01-20T10:30:00',
    customerId: CUSTOMER_ID,
    customerGivenName: 'Moussa',
    customerFatherName: 'Youssouf',
    customerPhoneNumber: '+23566123456',
    totalAmount: { amount: '200000.00', currency: 'XAF' },
    amountPaid: { amount: '100000.00', currency: 'XAF' },
    amountDue: { amount: '100000.00', currency: 'XAF' },
    settled: false,
    settledAt: null,
    daysOutstanding: 12,
    overdue: false,
    ...overrides,
  };
}

function page(content: DebtResponse[]): Page<DebtResponse> {
  return { content, page: { page: 0, size: 20, totalElements: content.length, totalPages: 1 } };
}

describe('CustomerDebtsPage', () => {
  let component: CustomerDebtsPage;
  let fixture: ComponentFixture<CustomerDebtsPage>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CustomerDebtsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ customerId: CUSTOMER_ID }) } },
        },
      ],
    });

    fixture = TestBed.createComponent(CustomerDebtsPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  function debtsRequests(): TestRequest[] {
    return httpTesting.match((request) => request.url === `/api/v1/customers/${CUSTOMER_ID}/debts`);
  }

  it('interroge les deux statuts sur le périmètre du client', () => {
    httpTesting.expectOne(`/api/v1/customers/${CUSTOMER_ID}`).flush({
      customerId: CUSTOMER_ID,
      givenName: 'Moussa',
      fatherName: 'Youssouf',
      phoneNumber: '+23566123456',
      email: null,
    });

    const requests = debtsRequests();
    expect(requests.length).toBe(2);
    expect(requests.map((request) => request.request.params.get('status')).sort()).toEqual([
      'OUTSTANDING',
      'SETTLED',
    ]);

    requests[0].flush(page([debt()]));
    requests[1].flush(page([debt({ saleId: 'sale-2', settled: true, daysOutstanding: 8 })]));
    fixture.detectChanges();

    expect(component.outstanding.debts().length).toBe(1);
    expect(component.settled.debts().length).toBe(1);
    expect(component.customerName()).toBe('Moussa Youssouf');
  });

  it('distingue les deux sections quand le client est à jour', () => {
    httpTesting.expectOne(`/api/v1/customers/${CUSTOMER_ID}`).flush({
      customerId: CUSTOMER_ID,
      givenName: 'Moussa',
      fatherName: null,
      phoneNumber: '+23566123456',
      email: null,
    });

    for (const request of debtsRequests()) {
      request.flush(page([]));
    }
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Ce client ne vous doit rien.');
    expect(text).toContain('Aucun règlement enregistré.');
  });
});
