import { DebtResponse } from './debt.model';

/**
 * Ancienneté d'une créance, formulée selon son état.
 *
 * Le piège : `daysOutstanding` s'arrête au jour du règlement pour une créance
 * éteinte — une dette réglée en une semaine il y a six mois vaut 8, pas 180. Et
 * `overdue` sur une créance soldée ne dit pas « en retard aujourd'hui » mais
 * « a été réglée au-delà du délai toléré ». Les deux états n'emploient donc
 * jamais les mêmes mots.
 */
export interface DebtAgeLabel {
  /** Phrase principale, toujours lisible sans couleur. */
  readonly text: string;
  /** Mention d'alerte, absente quand tout va bien. */
  readonly warning: string | null;
}

export function debtAgeLabel(debt: DebtResponse): DebtAgeLabel {
  if (debt.settled) {
    return {
      text:
        debt.daysOutstanding === 0
          ? 'Réglée le jour même'
          : `Réglée en ${dayCount(debt.daysOutstanding)}`,
      warning: debt.overdue ? 'Réglée hors délai' : null,
    };
  }

  return {
    text:
      debt.daysOutstanding === 0
        ? recentDebtLabel(debt.occurredAt)
        : `Ouverte depuis ${dayCount(debt.daysOutstanding)}`,
    warning: debt.overdue ? 'En retard' : null,
  };
}

function recentDebtLabel(occurredAt: string): string {
  // Le serveur renvoie l'heure métier de N'Djamena sans fuseau. On conserve
  // donc HH:mm tel quel au lieu de la reconvertir selon le poste qui consulte.
  const time = occurredAt.match(/T(\d{2}:\d{2})/)?.[1];
  return time ? `Ouverte depuis moins de 24 h · ${time}` : 'Ouverte depuis moins de 24 h';
}

function dayCount(days: number): string {
  return days > 1 ? `${days} jours` : `${days} jour`;
}
