import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';
import { Pagination } from '../../../../shared/ui/pagination/pagination';
import { DebtList } from '../../ui/debt-list/debt-list';
import { DebtListSkeleton } from '../../ui/debt-list-skeleton/debt-list-skeleton';
import { DebtsListStore } from '../../state/debts-list.store';
import { DebtStatus, isDebtStatus } from '../../models/debt.model';

interface EmptyMessage {
  readonly title: string;
  readonly text: string;
}

// Un message générique serait au mieux inutile : chaque filtre décrit sa
// propre absence de résultat, et « personne ne vous doit rien » est une bonne
// nouvelle, pas une erreur.
const EMPTY_MESSAGES: Record<DebtStatus, EmptyMessage> = {
  OUTSTANDING: {
    title: 'Personne ne vous doit d’argent.',
    text: 'Toutes les ventes à crédit ont été réglées.',
  },
  SETTLED: {
    title: 'Aucune créance n’a encore été réglée.',
    text: 'Les créances soldées apparaîtront ici, avec la preuve du règlement.',
  },
  ALL: {
    title: 'Aucune vente à crédit n’a encore été enregistrée.',
    text: 'Les ventes réglées au comptoir n’entrent pas dans les créances.',
  },
};

@Component({
  selector: 'app-debts-page',
  imports: [RouterLink, MoneyPipe, EmptyState, Pagination, DebtList, DebtListSkeleton],
  templateUrl: './debts-page.html',
  styleUrl: './debts-page.scss',
  providers: [DebtsListStore],
})
export class DebtsPage {
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(DebtsListStore);

  // Le filtre vit dans l'URL : un rafraîchissement ou un lien partagé retombe
  // sur le même écran.
  private readonly statusParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('status'))),
    { initialValue: null }
  );

  readonly status = computed<DebtStatus>(() => {
    const value = this.statusParam();
    return isDebtStatus(value) ? value : 'OUTSTANDING';
  });

  readonly emptyMessage = computed(() => EMPTY_MESSAGES[this.status()]);

  // La somme des dettes éteintes ne veut rien dire : elle laisserait croire à
  // un encours qui n'existe pas.
  readonly showAmountDue = computed(() => this.status() === 'OUTSTANDING');

  constructor() {
    effect(() => this.store.load(this.status()));
  }
}
