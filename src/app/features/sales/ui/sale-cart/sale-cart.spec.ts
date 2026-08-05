import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartLine } from '../../models/cart-line.model';
import { SaleCart } from './sale-cart';

describe('SaleCart', () => {
  let fixture: ComponentFixture<SaleCart>;

  const line: CartLine = {
    productId: 'product-1',
    productLabel: 'Alternateur',
    unitPrice: { amount: '25000', currency: 'XAF' },
    quantity: 2,
    subtotal: { amount: '50000', currency: 'XAF' },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SaleCart] }).compileComponents();

    fixture = TestBed.createComponent(SaleCart);
    fixture.componentRef.setInput('lines', [line]);
    fixture.componentRef.setInput('total', { amount: '50000', currency: 'XAF' });
    fixture.detectChanges();
  });

  it('rend deux contrôles de quantité accessibles avec des icônes homogènes', () => {
    const root = fixture.nativeElement as HTMLElement;
    const controls = root.querySelectorAll<HTMLButtonElement>('.qty-btn');

    expect(controls.length).toBe(2);
    expect(controls[0].getAttribute('aria-label')).toContain('Diminuer');
    expect(controls[1].getAttribute('aria-label')).toContain('Augmenter');
    expect(controls[0].querySelector('svg')).not.toBeNull();
    expect(controls[1].querySelector('svg')).not.toBeNull();
  });

  it('émet la nouvelle quantité sans permettre de descendre sous un', () => {
    const emitted: number[] = [];
    fixture.componentInstance.quantityChanged.subscribe((change) => emitted.push(change.quantity));

    fixture.componentInstance.step(line, 1);
    fixture.componentInstance.step({ ...line, quantity: 1 }, -1);

    expect(emitted).toEqual([3]);
  });
});
