import { Money } from '../../../core/api/money.model';

export interface ProductInfo {
    readonly name: string;
    readonly reference: string;
    readonly categoryId: string;
    readonly unitPrice: Money;
    readonly minimumGlobalThreshold: number;
}

export interface ReceivingDistribution {
    readonly locationId: string;
    readonly quantity: number;
}

export interface ReceiveStockRequest {
    readonly productReference: string;
    readonly newProductInfo?: ProductInfo | null;
    readonly shopId: string;
    readonly userId: string;
    readonly distributions: readonly ReceivingDistribution[];
}

export interface StockReceiptAcknowledgement {
    readonly productId: string;
    readonly totalReceived: number;
    readonly acceptedAt: string;
    readonly movementIds?: readonly string[];
}