import { Money } from '../../../core/api/money.model';

export type StockAlertStatus = 'OUT_OF_STOCK' | 'BELOW_THRESHOLD';
export type DebtAgeBand = 'DAYS_0_7' | 'DAYS_8_14' | 'DAYS_15_30' | 'OVER_30_DAYS';
export type ActivityType = 'SALE' | 'STOCK_RECEIPT' | 'STOCK_TRANSFER' | 'DEBT_PAYMENT';

export interface DashboardSummary {
  readonly generatedAt: string;
  readonly periods: DashboardPeriods;
  readonly attention: DashboardAttention;
  readonly stock: StockSummary;
  readonly sales: SalesSummary;
  readonly debts: DebtSummary;
  readonly recentActivity: readonly RecentActivity[];
}

export interface DashboardPeriods {
  readonly todayStart: string;
  readonly tomorrowStart: string;
  readonly last7DaysStart: string;
  readonly previous7DaysStart: string;
}

export interface DashboardAttention {
  readonly outOfStockCount: number;
  readonly belowThresholdCount: number;
  readonly overdueCustomerCount: number;
}

export interface StockSummary {
  readonly outOfStockCount: number;
  readonly belowThresholdCount: number;
  readonly alerts: readonly StockAlert[];
}

export interface StockAlert {
  readonly productId: string;
  readonly reference: string;
  readonly name: string;
  readonly availableQuantity: number;
  readonly threshold: number;
  readonly shortage: number;
  readonly status: StockAlertStatus;
}

export interface SalesSummary {
  readonly today: SalesPeriod;
  readonly last7Days: SalesPeriod;
  readonly revenueChangePercent: number | null;
  readonly bestSeller: TopProduct | null;
  readonly topProducts: readonly TopProduct[];
}

export interface SalesPeriod {
  readonly saleCount: number;
  readonly itemsSold: number;
  readonly revenue: Money;
  readonly averageBasket: Money;
}

export interface TopProduct {
  readonly productId: string;
  readonly reference: string;
  readonly name: string;
  readonly quantitySold: number;
  readonly revenue: Money;
}

export interface DebtSummary {
  readonly openDebtCount: number;
  readonly openCustomerCount: number;
  readonly overdueCustomerCount: number;
  readonly totalOutstanding: Money;
  readonly aging: readonly DebtAging[];
  readonly customersToContact: readonly CustomerDebtAlert[];
}

export interface DebtAging {
  readonly band: DebtAgeBand;
  readonly debtCount: number;
  readonly amountDue: Money;
}

export interface CustomerDebtAlert {
  readonly customerId: string;
  readonly givenName: string;
  readonly fatherName: string | null;
  readonly phoneNumber: string;
  readonly openDebtCount: number;
  readonly totalDue: Money;
  readonly oldestSaleId: string;
  readonly oldestSaleAt: string;
  readonly daysOutstanding: number;
}

export interface RecentActivity {
  readonly type: ActivityType;
  readonly resourceId: string;
  readonly occurredAt: string;
  readonly actorName: string;
  readonly itemCount: number;
  readonly quantity: number;
  readonly amount: Money | null;
}
