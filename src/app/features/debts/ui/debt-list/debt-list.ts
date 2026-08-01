import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { SettlementBadge } from '../../../../shared/ui/settlement-badge/settlement-badge';
import { customerDisplayName, telHref } from '../../../customers/models/customer.model';
import { debtAgeLabel, DebtAgeLabel } from '../../models/debt-age';
import { DebtResponse } from '../../models/debt.model';

interface DebtRow {
  readonly saleId: string;
  readonly occurredAt: string;
  readonly customerName: string;
  readonly phoneNumber: string;
  readonly phoneHref: string;
  readonly totalAmount: DebtResponse['totalAmount'];
  readonly amountPaid: DebtResponse['amountPaid'];
  readonly amountDue: DebtResponse['amountDue'];
  readonly settled: boolean;
  readonly age: DebtAgeLabel;
}

/**
 * Liste de créances, sans dépendance HTTP : le même rendu sert à l'écran global
 * et à la fiche client, pour que le patron n'ait pas à se souvenir d'où il
 * vient. Chaque ligne est un vrai lien — donc ouvrable dans un nouvel onglet.
 */
@Component({
  selector: 'app-debt-list',
  imports: [DatePipe, RouterLink, MoneyPipe, SettlementBadge],
  templateUrl: './debt-list.html',
  styleUrl: './debt-list.scss',
})
export class DebtList {
  readonly debts = input.required<readonly DebtResponse[]>();
  readonly caption = input('Créances');

  readonly rows = computed<DebtRow[]>(() =>
    this.debts().map((debt) => ({
      saleId: debt.saleId,
      occurredAt: debt.occurredAt,
      customerName: customerDisplayName(debt.customerGivenName, debt.customerFatherName),
      phoneNumber: debt.customerPhoneNumber,
      phoneHref: telHref(debt.customerPhoneNumber),
      totalAmount: debt.totalAmount,
      amountPaid: debt.amountPaid,
      amountDue: debt.amountDue,
      settled: debt.settled,
      age: debtAgeLabel(debt),
    }))
  );
}
