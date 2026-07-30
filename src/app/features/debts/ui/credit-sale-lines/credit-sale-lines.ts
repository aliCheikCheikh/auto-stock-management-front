import { Component, input } from '@angular/core';
import { Money } from '../../../../core/api/money.model';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { CreditSaleLine } from '../../models/credit-sale-detail.model';

/**
 * Les produits vendus : c'est ce qui justifie le montant réclamé au client.
 * Purement présentationnel — le total vient du serveur, jamais d'une somme
 * refaite ici.
 */
@Component({
  selector: 'app-credit-sale-lines',
  imports: [MoneyPipe],
  templateUrl: './credit-sale-lines.html',
  styleUrl: './credit-sale-lines.scss',
})
export class CreditSaleLines {
  readonly lines = input.required<readonly CreditSaleLine[]>();
  readonly total = input.required<Money>();
}
