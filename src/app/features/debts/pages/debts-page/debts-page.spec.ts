import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebtsPage } from './debts-page';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OutstandingDebtResponse } from '../../models/debt.model';

function debt(overrides: Partial<OutstandingDebtResponse> = {}): OutstandingDebtResponse {
  return {
    saleId: 'sale-1',
    occurredAt: new Date().toISOString(),
    customerId: 'customer-1',
    customerGivenName: 'Ahmat',
    customerFatherName: 'Youssouf',
    customerPhoneNumber: '+23566123456',
    totalAmount: { amount: '50000', currency: 'XAF' },
    amountPaid: { amount: '20000', currency: 'XAF' },
    amountDue: { amount: '30000', currency: 'XAF' },
    daysOutstanding: 3,
    overdue: false,
    ...overrides,
  };
}

describe('DebtsPage', () => {
  let component: DebtsPage;
  let fixture: ComponentFixture<DebtsPage>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebtsPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DebtsPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('should create', () => {
    httpTesting.expectOne('/api/v1/debts').flush([]);
    expect(component).toBeTruthy();
  });

  it('additionne les soldes sans passer par Number', () => {
    httpTesting.expectOne('/api/v1/debts').flush([
      debt(),
      debt({ saleId: 'sale-2', amountDue: { amount: '12500.50', currency: 'XAF' } }),
    ]);

    expect(component.totalDue()).toEqual({ amount: '42500.50', currency: 'XAF' });
  });

  it('reprend le retard tel que le backend le déclare', () => {
    httpTesting.expectOne('/api/v1/debts').flush([
      debt({ daysOutstanding: 45, overdue: true }),
      debt({ saleId: 'sale-2' }),
    ]);

    expect(component.overdueRows().length).toBe(1);
    expect(component.overdueAmount()).toEqual({ amount: '30000', currency: 'XAF' });
  });

  it('trie par reste dû décroissant à la demande', () => {
    httpTesting.expectOne('/api/v1/debts').flush([
      debt({ amountDue: { amount: '1000', currency: 'XAF' } }),
      debt({ saleId: 'sale-2', amountDue: { amount: '90000', currency: 'XAF' } }),
    ]);

    expect(component.filteredRows()[0].saleId).toBe('sale-1');

    component.sortBy('amountDue');
    expect(component.filteredRows()[0].saleId).toBe('sale-2');
  });

  it('compte les clients concernés sans doublon', () => {
    httpTesting.expectOne('/api/v1/debts').flush([
      debt(),
      debt({ saleId: 'sale-2' }),
      debt({ saleId: 'sale-3', customerId: 'customer-2' }),
    ]);

    expect(component.customerCount()).toBe(2);
  });

  it('filtre sur le nom ou le téléphone', () => {
    httpTesting.expectOne('/api/v1/debts').flush([
      debt(),
      debt({ saleId: 'sale-2', customerGivenName: 'Mahamat', customerPhoneNumber: '+23599887766' }),
    ]);

    component.searchControl.setValue('mahamat');
    expect(component.filteredRows().length).toBe(1);

    component.searchControl.setValue('66 12 34');
    expect(component.filteredRows()[0].saleId).toBe('sale-1');
  });
});
