import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DashboardApiService } from './dashboard-api.service';
import { DashboardSummary } from '../models/dashboard.model';

describe('DashboardApiService', () => {
  let service: DashboardApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('charge le résumé opérationnel borné', () => {
    service.getSummary().subscribe((summary) => {
      expect(summary.attention.outOfStockCount).toBe(2);
    });

    const request = httpTesting.expectOne('/api/v1/dashboard/summary');
    expect(request.request.method).toBe('GET');
    request.flush(summaryFixture());
  });
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
    stock: { outOfStockCount: 2, belowThresholdCount: 3, alerts: [] },
    sales: {
      today: moneyPeriod('125000', 3, 5),
      last7Days: moneyPeriod('600000', 12, 18),
      revenueChangePercent: 12.5,
      bestSeller: null,
      topProducts: [],
    },
    debts: {
      openDebtCount: 0,
      openCustomerCount: 0,
      overdueCustomerCount: 0,
      totalOutstanding: { amount: '0', currency: 'XAF' },
      aging: [],
      customersToContact: [],
    },
    recentActivity: [],
  };
}

function moneyPeriod(revenue: string, saleCount: number, itemsSold: number) {
  return {
    saleCount,
    itemsSold,
    revenue: { amount: revenue, currency: 'XAF' },
    averageBasket: { amount: saleCount === 0 ? '0' : '50000', currency: 'XAF' },
  };
}
