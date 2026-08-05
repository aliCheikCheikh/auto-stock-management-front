import { DatePipe, DOCUMENT } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  catchError,
  EMPTY,
  exhaustMap,
  filter,
  fromEvent,
  interval,
  map,
  merge,
  Observable,
  of,
  Subject,
} from 'rxjs';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { Spinner } from '../../../../shared/ui/spinner/spinner';
import { DashboardApiService } from '../../data-access/dashboard-api.service';
import {
  CustomerDebtAlert,
  DashboardSummary,
  RecentActivity,
  StockAlert,
} from '../../models/dashboard.model';

type DashboardState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly summary: DashboardSummary }
  | { readonly status: 'error' };

const DASHBOARD_REFRESH_INTERVAL_MS = 60_000;

@Component({
  selector: 'app-dashboard-page',
  imports: [DatePipe, MoneyPipe, RouterLink, Spinner],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  private readonly api = inject(DashboardApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly manualRefresh = new Subject<void>();

  readonly state = signal<DashboardState>({ status: 'loading' });
  readonly summary = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.summary : null;
  });

  constructor() {
    merge(
      of(undefined),
      interval(DASHBOARD_REFRESH_INTERVAL_MS).pipe(
        filter(() => this.document.visibilityState === 'visible'),
        map(() => undefined),
      ),
      fromEvent(this.document, 'visibilitychange').pipe(
        filter(() => this.document.visibilityState === 'visible'),
        map(() => undefined),
      ),
      this.manualRefresh,
    )
      .pipe(
        exhaustMap(() => this.load()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((summary) => this.state.set({ status: 'ready', summary }));
  }

  retry(): void {
    this.state.set({ status: 'loading' });
    this.manualRefresh.next();
  }

  customerName(customer: CustomerDebtAlert): string {
    return [customer.givenName, customer.fatherName].filter(Boolean).join(' ');
  }

  stockStatus(alert: StockAlert): string {
    return alert.status === 'OUT_OF_STOCK' ? 'Rupture' : 'Sous seuil';
  }

  activityTitle(activity: RecentActivity): string {
    switch (activity.type) {
      case 'SALE':
        return 'Vente enregistrée';
      case 'STOCK_RECEIPT':
        return 'Réception de stock';
      case 'STOCK_TRANSFER':
        return 'Transfert de stock';
      case 'DEBT_PAYMENT':
        return 'Paiement de créance';
    }
  }

  activityDetail(activity: RecentActivity): string {
    switch (activity.type) {
      case 'SALE':
        return `${activity.quantity} article${activity.quantity > 1 ? 's' : ''}`;
      case 'STOCK_RECEIPT':
      case 'STOCK_TRANSFER':
        return `${activity.itemCount} produit${activity.itemCount > 1 ? 's' : ''} · ${activity.quantity} unité${activity.quantity > 1 ? 's' : ''}`;
      case 'DEBT_PAYMENT':
        return 'Encaissement client';
    }
  }

  activityLink(activity: RecentActivity): readonly string[] {
    switch (activity.type) {
      case 'DEBT_PAYMENT':
        return ['/creances', activity.resourceId];
      case 'SALE':
        return ['/sales'];
      case 'STOCK_RECEIPT':
      case 'STOCK_TRANSFER':
        return ['/stock-movements'];
    }
  }

  private load(): Observable<DashboardSummary> {
    return this.api.getSummary().pipe(
      catchError(() => {
        if (this.state().status !== 'ready') {
          this.state.set({ status: 'error' });
        }
        return EMPTY;
      }),
    );
  }
}
