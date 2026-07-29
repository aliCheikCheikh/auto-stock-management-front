import { MovementType } from './stock-movement.model';

/** Une ligne de détail : un produit déplacé au sein d'une opération. */
export interface MovementRow {
  readonly movementId: string;
  readonly operationId: string;
  readonly date: string;
  readonly typeKind: MovementType;
  readonly typeLabel: string;
  readonly authorName: string;
  readonly productName: string;
  readonly quantity: number;
  readonly locationLabel: string;
  readonly destinationLabel: string | null;
}

/**
 * Une opération (réception, vente, transfert) et les mouvements qu'elle a
 * produits. Une réception de trois produits est UN événement, pas trois.
 */
export interface MovementGroup {
  readonly operationId: string;
  readonly date: string;
  readonly typeKind: MovementType;
  readonly typeLabel: string;
  readonly authorName: string;
  readonly lines: readonly MovementRow[];
}

/**
 * Regroupe les mouvements par `operationId` — garantie du backend, jamais une
 * déduction sur la date et l'auteur. L'ordre d'arrivée est conservé : le tri
 * reste celui du serveur.
 *
 * Le regroupement ne porte que sur la page affichée : le serveur pagine des
 * mouvements, pas des opérations, donc une opération peut être coupée entre
 * deux pages. On l'assume plutôt que de recoller des groupes à tort.
 */
export function groupByOperation(rows: readonly MovementRow[]): MovementGroup[] {
  const groups = new Map<string, MovementRow[]>();

  for (const row of rows) {
    // Repli sur l'identifiant du mouvement : une donnée ancienne sans
    // operationId reste affichée, seule dans son groupe.
    const key = row.operationId || row.movementId;
    const existing = groups.get(key);
    if (existing) {
      existing.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  return Array.from(groups.entries()).map(([operationId, lines]) => ({
    operationId,
    date: lines[0].date,
    typeKind: lines[0].typeKind,
    typeLabel: lines[0].typeLabel,
    authorName: lines[0].authorName,
    lines,
  }));
}
