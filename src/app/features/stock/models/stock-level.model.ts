export type LocationType = 'SHOP_FLOOR' | 'BACKSTOCK';

export interface StockLevel {
    readonly productId: string;
    readonly productName?: string;
    readonly locationId: string;
    readonly locationName?: string;
    readonly locationType?: LocationType;
    readonly shopId?: string;
    readonly quantity: number;
}