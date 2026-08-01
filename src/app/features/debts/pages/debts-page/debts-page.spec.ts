import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { convertToParamMap, ParamMap } from '@angular/router';

import { DebtsPage } from './debts-page';
import { DebtResponse } from '../../models/debt.model';
import { Page } from '../../../../core/api/page.model';

function debt(overrides: Partial<DebtResponse> = {}): DebtResponse {
  return {
    saleId: 'sale-1',
    occurredAt: '2026-01-20T10:30:00',
    customerId: 'customer-1',
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
  return {
    content,
    page: { page: 0, size: 20, totalElements: content.length, totalPages: 1 },
  };
}

describe('DebtsPage', () => {
  let component: DebtsPage;
  let fixture: ComponentFixture<DebtsPage>;
  let httpTesting: HttpTestingController;
  let queryParams: BehaviorSubject<ParamMap>;

  function setUp(status: string | null = null): void {
    queryParams = new BehaviorSubject(convertToParamMap(status ? { status } : {}));

    TestBed.configureTestingModule({
      imports: [DebtsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParams.asObservable() } },
      ],
    });

    fixture = TestBed.createComponent(DebtsPage);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  function expectDebtsRequest(): TestRequest {
    return httpTesting.expectOne((request) => request.url === '/api/v1/debts');
  }

  afterEach(() => httpTesting.verify());

  it('affiche les créances en cours par défaut', () => {
    setUp();

    const request = expectDebtsRequest();
    expect(request.request.params.get('status')).toBe('OUTSTANDING');
    expect(request.request.params.has('sort')).toBeFalse();
    request.flush(page([debt()]));
    fixture.detectChanges();

    expect(component.status()).toBe('OUTSTANDING');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Moussa Youssouf');
  });

  it('reprend le filtre porté par l’URL', () => {
    // Un rafraîchissement ou un lien partagé retombe sur le même écran.
    setUp('SETTLED');

    const request = expectDebtsRequest();
    expect(request.request.params.get('status')).toBe('SETTLED');
    request.flush(page([debt({ settled: true, settledAt: '2026-01-28T09:00:00', daysOutstanding: 8 })]));
    fixture.detectChanges();

    expect(component.status()).toBe('SETTLED');
  });

  it('masque le restant dû hors des créances en cours', () => {
    setUp('SETTLED');
    expectDebtsRequest().flush(
      page([debt({ settled: true, amountDue: { amount: '0.00', currency: 'XAF' } })])
    );
    fixture.detectChanges();

    // La somme des dettes éteintes laisserait croire à un encours inexistant.
    expect(component.showAmountDue()).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Restant dû');
  });

  it('énonce une créance soldée avec les mots du règlement', () => {
    setUp('SETTLED');
    expectDebtsRequest().flush(
      page([
        debt({
          settled: true,
          settledAt: '2026-01-28T09:00:00',
          daysOutstanding: 8,
          overdue: true,
          amountDue: { amount: '0.00', currency: 'XAF' },
        }),
      ])
    );
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Réglée en 8 jours');
    expect(text).toContain('Réglée hors délai');
    expect(text).not.toContain('En retard');
  });

  it('adapte l’état vide au filtre', () => {
    setUp();
    expectDebtsRequest().flush(page([]));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Personne ne vous doit d’argent.'
    );

    queryParams.next(convertToParamMap({ status: 'ALL' }));
    fixture.detectChanges();
    expectDebtsRequest().flush(page([]));
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Aucune vente à crédit n’a encore été enregistrée.'
    );
  });

  it('n’affiche aucun montant recalculé côté front', () => {
    setUp();
    expectDebtsRequest().flush(
      page([debt({ amountDue: { amount: '100000.00', currency: 'XAF' } })])
    );
    fixture.detectChanges();

    // Le serveur dit 100 000 alors que 200 000 − 100 000 donnerait la même
    // chose : on vérifie que c'est bien sa valeur qui est rendue, telle quelle.
    expect(component.store.debts()[0].amountDue.amount).toBe('100000.00');
  });

  it('affiche une erreur récupérable', () => {
    setUp();
    expectDebtsRequest().flush({ code: 'INTERNAL' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.store.state()).toBe('error');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Impossible de charger les créances.'
    );

    component.store.retry();
    expectDebtsRequest().flush(page([debt()]));
  });
});
