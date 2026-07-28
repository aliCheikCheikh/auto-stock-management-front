import { Money } from "../../../core/api/money.model";

export interface CreateSaleLine {
    readonly productId: string;
    readonly quantity: number;
}

export interface CreateSaleRequest {
    readonly shopId: string;
    readonly lines: readonly CreateSaleLine[];
    // Vente à crédit : client rattaché à la vente. Obligatoire côté backend dès
    // que `amountPaid` est inférieur au total (422 CREDIT_SALE_REQUIRES_CUSTOMER).
    readonly customerId?: string;
    // Montant encaissé au comptoir, nombre nu (devise = celle du magasin).
    // Absent (avec `customerId`) = vente au comptant intégralement payée.
    readonly amountPaid?: number;
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
    // Volet crédit : renseigné par le backend, valeur faisant foi pour le solde.
    readonly customerId?: string | null;
    readonly amountPaid?: Money;
    readonly amountDue?: Money;
}