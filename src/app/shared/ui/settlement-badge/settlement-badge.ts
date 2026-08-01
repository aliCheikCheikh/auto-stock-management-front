import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Money } from '../../../core/api/money.model';
import { MoneyPipe } from '../../pipes/money.pipe';
import { saleSettlementOf } from '../../utils/sale-settlement';

/**
 * Repère « Payée / À crédit » d'une vente, partagé par l'historique des
 * mouvements et les listes de créances : une seule implémentation, donc un seul
 * vocabulaire à l'écran.
 *
 * L'état vient de `amountDue` et de lui seul. Le lien vers le détail n'est posé
 * que si l'appelant l'autorise (`saleId` connu et utilisateur propriétaire) :
 * le composant ne connaît pas les rôles.
 */
@Component({
  selector: 'app-settlement-badge',
  imports: [RouterLink, MoneyPipe],
  templateUrl: './settlement-badge.html',
  styleUrl: './settlement-badge.scss',
})
export class SettlementBadge {
  readonly amountDue = input<Money | null | undefined>(null);
  readonly saleId = input<string | null>(null);
  readonly linkable = input(false);
  // Le montant restant est utile dans un journal ; il ferait doublon dans une
  // liste qui porte déjà une colonne « Reste dû ».
  readonly showAmount = input(true);

  readonly settlement = computed(() => saleSettlementOf(this.amountDue()));
  readonly isLink = computed(
    () => this.linkable() && !!this.saleId() && this.settlement()?.kind === 'credit'
  );
}
