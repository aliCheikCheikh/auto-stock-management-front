export type MovementType = 'ENTRY' | 'EXIT' | 'TRANSFER';

export interface StockMovementResponse {
  readonly movementId: string;
  readonly productId: string;
  readonly locationId: string;
  readonly destinationLocationId: string | null;
  readonly type: MovementType;
  readonly quantity: number;
  readonly executedBy: string;
  readonly executedAt: string;
  readonly saleId: string | null;
}
