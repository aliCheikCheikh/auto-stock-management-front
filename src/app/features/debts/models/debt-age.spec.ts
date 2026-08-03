import { debtAgeLabel } from './debt-age';
import { DebtResponse } from './debt.model';

function debt(overrides: Partial<DebtResponse> = {}): DebtResponse {
  return {
    saleId: 'sale-1',
    occurredAt: '2026-01-20T10:30:00',
    customerId: 'customer-1',
    customerGivenName: 'Moussa',
    customerFatherName: 'Youssouf',
    customerPhoneNumber: '+23566123456',
    totalAmount: { amount: '200000.00', currency: 'XAF' },
    amountPaid: { amount: '100000.00', currency: 'XAF' },
    amountDue: { amount: '100000.00', currency: 'XAF' },
    settled: false,
    settledAt: null,
    daysOutstanding: 12,
    overdue: false,
    ...overrides,
  };
}

describe('debtAgeLabel', () => {
  it('compte les jours écoulés sur une créance ouverte', () => {
    expect(debtAgeLabel(debt())).toEqual({ text: 'Ouverte depuis 12 jours', warning: null });
  });

  it('annonce le retard du jour sur une créance ouverte', () => {
    expect(debtAgeLabel(debt({ overdue: true })).warning).toBe('En retard');
  });

  it('compte les jours qu’il a fallu pour régler, pas ceux écoulés depuis', () => {
    // Réglée en huit jours il y a six mois : on affiche 8, jamais 180.
    const label = debtAgeLabel(
      debt({ settled: true, settledAt: '2026-01-28T09:00:00', daysOutstanding: 8 })
    );

    expect(label.text).toBe('Réglée en 8 jours');
    expect(label.text).not.toContain('180');
  });

  it('dit « hors délai » sur une créance soldée, jamais « en retard »', () => {
    const label = debtAgeLabel(debt({ settled: true, daysOutstanding: 45, overdue: true }));

    expect(label.warning).toBe('Réglée hors délai');
    expect(label.warning).not.toBe('En retard');
  });

  it('accorde le singulier', () => {
    expect(debtAgeLabel(debt({ daysOutstanding: 1 })).text).toBe('Ouverte depuis 1 jour');
  });
});
