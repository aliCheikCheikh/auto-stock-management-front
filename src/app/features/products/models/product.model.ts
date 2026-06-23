import { Money } from '../../../core/api/money.model';
import { StockLevel } from '../../stock/models/stock-level.model';

export interface Product {
  readonly productId: string;
  readonly name: string;
  readonly reference: string;
  readonly categoryId: string;
  readonly unitPrice: Money;
  readonly minimumGlobalThreshold: number;
}

export interface ProductStockSummary {
  readonly productId: string;
  readonly productName: string;
  readonly globalQuantity: number;
  readonly minimumGlobalThreshold: number;
  readonly belowGlobalThreshold: boolean;
  readonly byLocation: readonly StockLevel[];
}

export interface UpdateProductRequest {
  readonly name: string;
  readonly unitPrice: Money;
  readonly minimumGlobalThreshold: number;
}
