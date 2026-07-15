export interface TransferStockRequest {
    readonly productId: string;
    readonly sourceLocationId: string;
    readonly destinationLocationId: string;
    readonly quantity: number;
}

export interface StockTransferAcknowledgement {
    readonly movementId: string;
    readonly acceptedAt: string;

}