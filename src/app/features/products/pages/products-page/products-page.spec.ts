import { Product } from '../../models/product.model';
import { getStockStatus } from './products-page';

describe('getStockStatus', () => {
  const product: Product = {
    productId: 'product-1',
    name: 'Alternateur',
    reference: 'ALT-001',
    categoryId: 'category-1',
    unitPrice: { amount: '25000', currency: 'XAF' },
    minimumGlobalThreshold: 10,
  };

  it('considère un stock nul comme critique', () => {
    expect(getStockStatus(product, 0)).toBe('critical');
  });

  it('considère un stock strictement inférieur au seuil comme bas', () => {
    expect(getStockStatus(product, 9)).toBe('low');
  });

  it('considère un stock égal au seuil comme suffisant', () => {
    expect(getStockStatus(product, 10)).toBe('ok');
  });

  it('considère un stock supérieur au seuil comme suffisant', () => {
    expect(getStockStatus(product, 11)).toBe('ok');
  });
});
