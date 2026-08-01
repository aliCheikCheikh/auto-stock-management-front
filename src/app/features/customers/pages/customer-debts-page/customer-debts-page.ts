import { Component, computed, inject, InjectionToken, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { DebtList } from '../../../debts/ui/debt-list/debt-list';
import { DebtListSkeleton } from '../../../debts/ui/debt-list-skeleton/debt-list-skeleton';
import { DebtsListStore } from '../../../debts/state/debts-list.store';
import { CustomersApiService } from '../../data-access/customers-api.service';
import { CustomerResponse, customerDisplayName, telHref } from '../../models/customer.model';

// Deux listes indépendantes sur le même écran : chacune son état de
// chargement et sa pagination.
const OUTSTANDING_STORE = new InjectionToken<DebtsListStore>('OutstandingDebtsStore');
const SETTLED_STORE = new InjectionToken<DebtsListStore>('SettledDebtsStore');

/**
 * Fiche client : ce qu'il doit encore, et ce qu'il a déjà réglé. La seconde
 * section répond à une question réelle du commerçant — « est-ce que je peux
 * encore lui faire crédit ? ».
 *
 * Les deux sections réutilisent les composants de la liste globale : c'est la
 * même question posée sur un périmètre plus étroit, et deux présentations
 * obligeraient le patron à se souvenir de quel écran il vient.
 */
@Component({
  selector: 'app-customer-debts-page',
  imports: [RouterLink, MoneyPipe, EmptyState, DebtList, DebtListSkeleton],
  templateUrl: './customer-debts-page.html',
  styleUrl: './customer-debts-page.scss',
  providers: [
    { provide: OUTSTANDING_STORE, useClass: DebtsListStore },
    { provide: SETTLED_STORE, useClass: DebtsListStore },
  ],
})
export class CustomerDebtsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly customersApi = inject(CustomersApiService);

  readonly outstanding = inject(OUTSTANDING_STORE);
  readonly settled = inject(SETTLED_STORE);

  readonly customer = signal<CustomerResponse | null>(null);

  readonly customerName = computed(() => {
    const customer = this.customer();
    return customer ? customerDisplayName(customer.givenName, customer.fatherName) : '';
  });

  readonly phoneHref = computed(() => telHref(this.customer()?.phoneNumber ?? ''));

  ngOnInit(): void {
    const customerId = this.route.snapshot.paramMap.get('customerId') ?? '';

    this.customersApi.getCustomer(customerId).subscribe({
      next: (customer) => this.customer.set(customer),
      error: () => this.customer.set(null),
    });

    this.outstanding.scopeToCustomer(customerId);
    this.outstanding.load('OUTSTANDING');

    this.settled.scopeToCustomer(customerId);
    this.settled.load('SETTLED');
  }
}
