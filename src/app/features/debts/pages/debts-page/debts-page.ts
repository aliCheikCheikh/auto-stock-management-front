import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DebtsApiService } from '../../data-access/debts-api.service';
import { OutstandingDebtResponse } from '../../models/debt.model';
import { Money } from '../../../../core/api/money.model';
import { customerDisplayName, telHref } from '../../../customers/models/customer.model';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { Spinner } from '../../../../shared/ui/spinner/spinner';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { createLocalPagination } from '../../../../shared/utils/local-pagination';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { compareAmounts, sumMoney } from '../../../../shared/utils/money-math';
import { RecordPaymentDialog } from '../../ui/record-payment-dialog/record-payment-dialog';
import { DebtPaymentTarget, PaymentResponse } from '../../models/payment.model';
import { formatMoney } from '../../../../shared/pipes/money.pipe';

// Tri par défaut : l'ordre du backend, du plus ancien au plus récent.
export type DebtSort = 'oldest' | 'amountDue';

interface DebtRow {
  readonly saleId: string;
  readonly occurredAt: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly phoneNumber: string;
  readonly phoneHref: string;
  readonly totalAmount: Money;
  readonly amountPaid: Money;
  readonly amountDue: Money;
  readonly daysOutstanding: number;
  readonly overdue: boolean;
  // Clé de recherche : nom et téléphone normalisés une fois au chargement.
  readonly searchKey: string;
}

@Component({
  selector: 'app-debts-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MoneyPipe,
    Spinner,
    EmptyState,
    Pagination,
    RecordPaymentDialog,
  ],
  templateUrl: './debts-page.html',
  styleUrl: './debts-page.scss',
})
export class DebtsPage implements OnInit {
  private readonly debtsApi = inject(DebtsApiService);
  private readonly notificationService = inject(NotificationService);

  readonly state = signal<'loading' | 'success' | 'error'>('loading');
  readonly rows = signal<DebtRow[]>([]);
  readonly errorMessage = signal('');
  readonly sort = signal<DebtSort>('oldest');
  // Créance en cours d'encaissement (null = dialogue fermé).
  readonly payingDebt = signal<DebtPaymentTarget | null>(null);

  readonly searchControl = new FormControl('', { nonNullable: true });
  private readonly search = toSignal(
    this.searchControl.valueChanges.pipe(map((value) => normalizeText(value))),
    { initialValue: '' }
  );

  private readonly matchingRows = computed(() => {
    const term = this.search();
    if (!term) {
      return this.rows();
    }
    const digits = digitsOnly(term);
    return this.rows().filter(
      (row) => row.searchKey.includes(term) || (digits.length >= 2 && row.searchKey.includes(digits))
    );
  });

  readonly filteredRows = computed(() => {
    const rows = this.matchingRows();
    if (this.sort() === 'oldest') {
      return rows;
    }
    // Montants comparés en chaîne (BigDecimal), jamais en flottant.
    return [...rows].sort((a, b) => compareAmounts(b.amountDue.amount, a.amountDue.amount));
  });

  // Chiffres que le patron veut voir en premier.
  readonly totalDue = computed<Money>(() => sumMoney(this.filteredRows().map((row) => row.amountDue)));

  readonly customerCount = computed(
    () => new Set(this.filteredRows().map((row) => row.customerId)).size
  );

  readonly overdueRows = computed(() => this.filteredRows().filter((row) => row.overdue));

  readonly overdueAmount = computed<Money>(() =>
    sumMoney(this.overdueRows().map((row) => row.amountDue), this.totalDue().currency)
  );

  // GET /debts n'est pas paginé côté serveur : la pagination reste locale.
  // Les totaux en tête restent calculés sur l'ensemble filtré, pas sur la page.
  readonly debtsPage = createLocalPagination(this.filteredRows);

  constructor() {
    // Une nouvelle recherche repart de la première page ; un encaissement, qui
    // ne fait que recharger les données, conserve la position.
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.debtsPage.reset());
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.debtsApi.listDebts().subscribe({
      next: (debts) => {
        this.rows.set(debts.map((debt) => toRow(debt)));
        this.state.set('success');
      },
      error: () => {
        this.state.set('error');
        this.errorMessage.set('Impossible de charger les créances.');
        this.notificationService.error('Impossible de charger les créances.');
      },
    });
  }

  sortBy(sort: DebtSort): void {
    this.sort.set(sort);
    this.debtsPage.reset();
  }

  startPayment(row: DebtRow): void {
    this.payingDebt.set(toPaymentTarget(row));
  }

  cancelPayment(): void {
    this.payingDebt.set(null);
  }

  // Le solde annoncé est celui du serveur ; la liste est rechargée pour que les
  // totaux en tête suivent et qu'une créance soldée disparaisse.
  onPaymentRecorded(payment: PaymentResponse): void {
    this.payingDebt.set(null);
    this.notificationService.success(
      payment.settled
        ? 'Dette soldée'
        : `Remboursement encaissé — reste à payer : ${formatMoney(payment.amountDue)}`
    );
    this.load();
  }
}

function toPaymentTarget(row: DebtRow): DebtPaymentTarget {
  return {
    saleId: row.saleId,
    customerName: row.customerName,
    totalAmount: row.totalAmount,
    amountPaid: row.amountPaid,
    amountDue: row.amountDue,
  };
}

function toRow(debt: OutstandingDebtResponse): DebtRow {
  const customerName = customerDisplayName(debt.customerGivenName, debt.customerFatherName);
  return {
    saleId: debt.saleId,
    occurredAt: debt.occurredAt,
    customerId: debt.customerId,
    customerName,
    phoneNumber: debt.customerPhoneNumber,
    phoneHref: telHref(debt.customerPhoneNumber),
    totalAmount: debt.totalAmount,
    amountPaid: debt.amountPaid,
    amountDue: debt.amountDue,
    daysOutstanding: debt.daysOutstanding ?? 0,
    overdue: debt.overdue ?? false,
    searchKey: `${normalizeText(customerName)} ${digitsOnly(debt.customerPhoneNumber)}`,
  };
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}
