import { Money } from '../../../core/api/money.model';

export type MovementType = 'ENTRY' | 'EXIT' | 'TRANSFER';

export interface StockMovementResponse {
  readonly movementId: string;
  readonly productId: string;
  readonly locationId: string;
  readonly destinationLocationId: string | null;
  readonly type: MovementType;
  readonly quantity: number;
  readonly executedBy: string;
  // Nom affichable de l'auteur. `null` si le compte a été supprimé : l'écran
  // affiche alors un repli neutre, jamais l'identifiant technique.
  readonly executedByName: string | null;
  readonly executedAt: string;
  readonly saleId: string | null;
  // Forme du règlement de la vente d'origine. Absent hors vente (réception,
  // transfert) ; zéro = vente réglée ; positif = reste dû sur une vente à crédit.
  readonly saleAmountDue?: Money | null;
  // Opération à l'origine du mouvement : tous les mouvements d'une même
  // réception / vente / transfert la partagent. Garantie du backend.
  readonly operationId: string;
}
