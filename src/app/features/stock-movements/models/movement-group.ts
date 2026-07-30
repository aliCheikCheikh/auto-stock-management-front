import { Money } from '../../../core/api/money.model';
import { isPositiveAmount } from '../../../shared/utils/money-math';
import { MovementType } from './stock-movement.model';

/**
 * Forme du règlement d'une vente, telle que le serveur la renvoie :
 *  - `null` hors vente (réception, transfert) ;
 *  - `paid` quand le solde vaut zéro ;
 *  - `credit` avec le reste dû quand il est positif.
 * Aucun montant n'est recalculé : on lit `saleAmountDue`.
 */
export type SaleSettlement =
  | { readonly kind: 'paid' }
  | { readonly kind: 'credit'; readonly amountDue: Money };

export function saleSettlementOf(amountDue: Money | null | undefined): SaleSettlement | null {
  if (!amountDue) {
    return null;
  }
  return isPositiveAmount(amountDue.amount) ? { kind: 'credit', amountDue } : { kind: 'paid' };
}

/** Une ligne de détail : un produit déplacé au sein d'une opération. */
export interface MovementRow {
  readonly movementId: string;
  readonly operationId: string;
  readonly saleId: string | null;
  readonly settlement: SaleSettlement | null;
  readonly productId: string;
  readonly date: string;
  readonly typeKind: MovementType;
  readonly typeLabel: string;
  readonly authorName: string;
  readonly productName: string;
  readonly quantity: number;
  readonly locationLabel: string;
  readonly destinationLabel: string | null;
}

export interface MovementAllocation {
  readonly movementId: string;
  readonly quantity: number;
  readonly locationLabel: string;
  readonly destinationLabel: string | null;
}

/** Un produit et la manière dont sa quantité est répartie dans le magasin. */
export interface MovementProductGroup {
  readonly productId: string;
  readonly productName: string;
  readonly totalQuantity: number;
  readonly allocations: readonly MovementAllocation[];
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
  readonly saleId: string | null;
  // Renseigné pour une vente uniquement : réception et transfert n'ont pas de
  // forme de règlement.
  readonly settlement: SaleSettlement | null;
  readonly lines: readonly MovementRow[];
  readonly products: readonly MovementProductGroup[];
  readonly totalQuantity: number;
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
    saleId: lines[0].saleId,
    settlement: lines[0].settlement,
    lines,
    products: groupProducts(lines),
    totalQuantity: lines.reduce((total, line) => total + line.quantity, 0),
  }));
}

function groupProducts(lines: readonly MovementRow[]): MovementProductGroup[] {
  const products = new Map<string, MovementRow[]>();

  for (const line of lines) {
    const productLines = products.get(line.productId);
    if (productLines) {
      productLines.push(line);
    } else {
      products.set(line.productId, [line]);
    }
  }

  return Array.from(products.entries()).map(([productId, productLines]) => ({
    productId,
    productName: productLines[0].productName,
    totalQuantity: productLines.reduce((total, line) => total + line.quantity, 0),
    allocations: productLines.map((line) => ({
      movementId: line.movementId,
      quantity: line.quantity,
      locationLabel: line.locationLabel,
      destinationLabel: line.destinationLabel,
    })),
  }));
}
