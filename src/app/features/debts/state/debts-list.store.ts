import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, Subject, catchError, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Money } from '../../../core/api/money.model';
import { Page, PageMeta } from '../../../core/api/page.model';
import { sumMoney } from '../../../shared/utils/money-math';
import { CustomersApiService } from '../../customers/data-access/customers-api.service';
import { DebtsApiService, DEBTS_PAGE_SIZE } from '../data-access/debts-api.service';
import { DebtQuery, DebtResponse, DebtStatus } from '../models/debt.model';

const EMPTY_PAGE: PageMeta = { page: 0, size: DEBTS_PAGE_SIZE, totalElements: 0, totalPages: 0 };

/**
 * État d'une liste de créances : filtre, page, chargement. Fourni par l'écran
 * qui l'utilise, jamais en racine — l'écran global et la fiche client en ont
 * chacun le leur, sur le même code.
 *
 * Les requêtes passent par un `switchMap` : changer de filtre rapidement annule
 * la précédente au lieu d'empiler des réponses qui se doubleraient.
 */
@Injectable()
export class DebtsListStore {
  private readonly debtsApi = inject(DebtsApiService);
  private readonly customersApi = inject(CustomersApiService);

  private readonly requests = new Subject<DebtQuery>();
  private customerId: string | null = null;

  readonly status = signal<DebtStatus>('OUTSTANDING');
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly debts = signal<readonly DebtResponse[]>([]);
  readonly pageMeta = signal<PageMeta>(EMPTY_PAGE);

  readonly isEmpty = computed(() => this.state() === 'ready' && this.debts().length === 0);

  /**
   * Somme des soldes **de la page affichée**. Le serveur n'expose pas d'agrégat :
   * l'écran le dit plutôt que de laisser croire à un encours global.
   */
  readonly pageAmountDue = computed<Money>(() => sumMoney(this.debts().map((debt) => debt.amountDue)));

  constructor() {
    this.requests
      .pipe(
        tap(() => this.state.set('loading')),
        switchMap((query) => this.fetch(query)),
        takeUntilDestroyed()
      )
      .subscribe((page) => {
        if (page === null) {
          this.state.set('error');
          return;
        }
        this.debts.set(page.content);
        this.pageMeta.set(page.page);
        this.state.set('ready');
      });
  }

  /** Restreint la liste à un client (fiche client). */
  scopeToCustomer(customerId: string): void {
    this.customerId = customerId;
  }

  load(status: DebtStatus = this.status(), page = 0): void {
    this.status.set(status);
    this.requests.next({ status, page, customerId: this.customerId ?? undefined });
  }

  goToPage(page: number): void {
    this.requests.next({ status: this.status(), page, customerId: this.customerId ?? undefined });
  }

  retry(): void {
    this.goToPage(this.pageMeta().page);
  }

  private fetch(query: DebtQuery): Observable<Page<DebtResponse> | null> {
    const request$ = this.customerId
      ? this.customersApi.getCustomerDebts(this.customerId, query)
      : this.debtsApi.listDebts(query);

    return request$.pipe(catchError(() => of(null)));
  }
}
