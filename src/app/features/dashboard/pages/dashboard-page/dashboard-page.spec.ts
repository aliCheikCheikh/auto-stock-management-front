import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { DashboardApiService } from '../../data-access/dashboard-api.service';
import { DashboardSummary } from '../../models/dashboard.model';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  let fixture: ComponentFixture<DashboardPage>;
  let api: jasmine.SpyObj<DashboardApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<DashboardApiService>('DashboardApiService', ['getSummary']);
  });

  it('annonce le chargement sans afficher de faux indicateurs', () => {
    api.getSummary.and.returnValue(new Subject<DashboardSummary>());
    createComponent();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Chargement du tableau de bord');
    expect(root.querySelector('.dashboard-metric')).toBeNull();
  });

  it('affiche les urgences et les montants calculés par le backend', () => {
    api.getSummary.and.returnValue(of(summaryFixture()));
    createComponent();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('2 produits en rupture');
    expect(root.textContent).toContain('3 produits sous seuil');
    expect(root.textContent).toContain('125 000 FCFA');
    expect(root.textContent).toContain('Alternateur');
    expect(root.querySelector('a[href="/stock-receipts/new"]')).not.toBeNull();
    expect(root.querySelector('a[href="/clients/customer-1/creances"]')).not.toBeNull();
  });

  it('permet de réessayer après une erreur de chargement', () => {
    api.getSummary.and.returnValues(
      throwError(() => new Error('network')),
      of(summaryFixture())
    );
    createComponent();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Impossible de charger le tableau de bord');

    root.querySelector<HTMLButtonElement>('.dashboard-retry')?.click();
    fixture.detectChanges();

    expect(api.getSummary).toHaveBeenCalledTimes(2);
    expect(root.textContent).toContain('125 000 FCFA');
  });

  function createComponent(): void {
    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideRouter([]),
        { provide: DashboardApiService, useValue: api },
      ],
    });
    fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
  }
});

function summaryFixture(): DashboardSummary {
  return {
    generatedAt: '2026-08-06T10:15:00',
    periods: {
      todayStart: '2026-08-06T00:00:00',
      tomorrowStart: '2026-08-07T00:00:00',
      last7DaysStart: '2026-07-31T00:00:00',
      previous7DaysStart: '2026-07-25T00:00:00',
    },
    attention: { outOfStockCount: 2, belowThresholdCount: 3, overdueCustomerCount: 1 },
    stock: {
      outOfStockCount: 2,
      belowThresholdCount: 3,
      alerts: [
        {
          productId: 'product-1',
          reference: 'ALT-001',
          name: 'Alternateur',
          availableQuantity: 0,
          threshold: 4,
          shortage: 4,
          status: 'OUT_OF_STOCK',
        },
      ],
    },
    sales: {
      today: period('125000', '41666.67', 3, 5),
      last7Days: period('600000', '50000', 12, 18),
      revenueChangePercent: 12.5,
      bestSeller: {
        productId: 'product-1',
        reference: 'ALT-001',
        name: 'Alternateur',
        quantitySold: 7,
        revenue: { amount: '350000', currency: 'XAF' },
      },
      topProducts: [],
    },
    debts: {
      openDebtCount: 2,
      openCustomerCount: 1,
      overdueCustomerCount: 1,
      totalOutstanding: { amount: '80000', currency: 'XAF' },
      aging: [],
      customersToContact: [
        {
          customerId: 'customer-1',
          givenName: 'Moussa',
          fatherName: 'Mahamat',
          phoneNumber: '+23566000001',
          openDebtCount: 2,
          totalDue: { amount: '80000', currency: 'XAF' },
          oldestSaleId: 'sale-1',
          oldestSaleAt: '2026-06-27T10:15:00',
          daysOutstanding: 40,
        },
      ],
    },
    recentActivity: [
      {
        type: 'SALE',
        resourceId: 'sale-1',
        occurredAt: '2026-08-06T10:10:00',
        actorName: 'Amina',
        itemCount: 2,
        quantity: 3,
        amount: { amount: '50000', currency: 'XAF' },
      },
    ],
  };
}

function period(revenue: string, average: string, saleCount: number, itemsSold: number) {
  return {
    saleCount,
    itemsSold,
    revenue: { amount: revenue, currency: 'XAF' },
    averageBasket: { amount: average, currency: 'XAF' },
  };
}
