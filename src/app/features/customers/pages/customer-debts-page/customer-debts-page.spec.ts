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

function page(
  content: DebtResponse[],
  meta: Partial<Page<DebtResponse>['page']> = {}
): Page<DebtResponse> {
  return {
    content,
    page: { page: 0, size: 20, totalElements: content.length, totalPages: 1, ...meta },
  };
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

  it('distingue un client introuvable d’une erreur temporaire', () => {
    httpTesting.expectOne(`/api/v1/customers/${CUSTOMER_ID}`).flush('introuvable', {
      status: 404,
      statusText: 'Not Found',
    });

    for (const request of debtsRequests()) {
      request.flush(page([]));
    }
    fixture.detectChanges();

    expect(component.customerState()).toBe('not-found');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Client introuvable');
    expect(fixture.nativeElement.querySelector('.customer-section')).toBeNull();
  });

  it('permet de réessayer le chargement du client après une erreur', () => {
    httpTesting.expectOne(`/api/v1/customers/${CUSTOMER_ID}`).flush('indisponible', {
      status: 503,
      statusText: 'Service Unavailable',
    });

    for (const request of debtsRequests()) {
      request.flush(page([]));
    }
    fixture.detectChanges();

    expect(component.customerState()).toBe('error');
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.customer-state button')?.click();

    httpTesting.expectOne(`/api/v1/customers/${CUSTOMER_ID}`).flush({
      customerId: CUSTOMER_ID,
      givenName: 'Moussa',
      fatherName: null,
      phoneNumber: '+23566123456',
      email: null,
    });
    fixture.detectChanges();

    expect(component.customerState()).toBe('ready');
    expect(component.customerName()).toBe('Moussa');
  });

  it('pagine les deux sections indépendamment et qualifie le total de page', () => {
    httpTesting.expectOne(`/api/v1/customers/${CUSTOMER_ID}`).flush({
      customerId: CUSTOMER_ID,
      givenName: 'Moussa',
      fatherName: 'Youssouf',
      phoneNumber: '+23566123456',
      email: null,
    });

    const requests = debtsRequests();
    const outstandingRequest = requests.find((request) => request.request.params.get('status') === 'OUTSTANDING');
    const settledRequest = requests.find((request) => request.request.params.get('status') === 'SETTLED');

    outstandingRequest?.flush(page([debt()], { totalElements: 21, totalPages: 2 }));
    settledRequest?.flush(page(
      [debt({ saleId: 'sale-2', settled: true })],
      { totalElements: 41, totalPages: 3 }
    ));
    fixture.detectChanges();

    const paginations = (fixture.nativeElement as HTMLElement).querySelectorAll('app-pagination');
    expect(paginations.length).toBe(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Restant dû sur cette page');

    paginations[0].querySelectorAll('button')[1].click();

    const nextOutstanding = httpTesting.expectOne((request) =>
      request.url === `/api/v1/customers/${CUSTOMER_ID}/debts`
      && request.params.get('status') === 'OUTSTANDING'
      && request.params.get('page') === '1'
    );
    nextOutstanding.flush(page([debt({ saleId: 'sale-3' })], {
      page: 1,
      totalElements: 21,
      totalPages: 2,
    }));

    expect(component.outstanding.pageMeta().page).toBe(1);
    expect(component.settled.pageMeta().page).toBe(0);
  });
});
