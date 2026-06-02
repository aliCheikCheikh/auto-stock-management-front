import { Money } from "../../../core/api/money.model";

export interface CreateSaleLine {
    readonly productId: string;
    readonly quantity: number;
}

export interface CreateSaleRequest {
    readonly sellerId: string;
    readonly shopId: string;
    readonly lines: readonly CreateSaleLine[];
}

export interface SaleLineResponse {
    readonly productId: string;
    readonly quantity: number;
    readonly unitPrice: Money;
    readonly subtotal: Money;
}

export interface SaleResponse {
    readonly saleId: string;
    readonly sellerId: string;
    readonly lines: readonly SaleLineResponse[];
    readonly totalAmount: Money;
    readonly createdAt: string;
}