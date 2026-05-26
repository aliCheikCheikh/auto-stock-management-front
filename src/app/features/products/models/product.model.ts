import { Money } from '../../../core/api/money.model';

export interface Product {
  readonly productId: string;
  readonly name: string;
  readonly reference: string;
  readonly categoryId: string;
  readonly unitPrice: Money;
  readonly minimumGlobalThreshold: number;
}
