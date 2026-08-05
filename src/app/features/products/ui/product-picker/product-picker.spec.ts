import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ProductPicker } from './product-picker';
import { ProductSearchResult } from '../../models/product.model';

const RESULT: ProductSearchResult = {
  productId: 'product-1',
  name: 'Riz parfumé',
  reference: 'RIZ-001',
  unitPrice: { amount: '2500', currency: 'XAF' },
};

describe('ProductPicker', () => {
  let component: ProductPicker;
  let fixture: ComponentFixture<ProductPicker>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductPicker],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductPicker);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('génère des identifiants ARIA uniques par instance', () => {
    const secondFixture = TestBed.createComponent(ProductPicker);
    secondFixture.detectChanges();

    expect(secondFixture.componentInstance.listboxId).not.toBe(component.listboxId);
    expect(secondFixture.componentInstance.optionId(0)).not.toBe(component.optionId(0));

    secondFixture.destroy();
  });

  it('expose le chargement puis les résultats', fakeAsync(() => {
    component.onFocus();
    component.searchControl.setValue('riz');
    fixture.detectChanges();

    expect(component.isLoading()).toBeTrue();
    tick(250);

    const request = httpTesting.expectOne((r) => r.url === '/api/v1/products/search');
    expect(request.request.params.get('q')).toBe('riz');
    request.flush([RESULT]);
    fixture.detectChanges();

    expect(component.searchState()).toBe('ready');
    expect(component.results()).toEqual([RESULT]);
  }));

  it('distingue une recherche vide d’un échec et permet de réessayer', fakeAsync(() => {
    component.onFocus();
    component.searchControl.setValue('riz');
    tick(250);

    httpTesting.expectOne('/api/v1/products/search?q=riz').flush('indisponible', {
      status: 503,
      statusText: 'Service Unavailable',
    });
    fixture.detectChanges();

    expect(component.hasError()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.product-picker__retry')).not.toBeNull();

    component.retrySearch();
    expect(component.isLoading()).toBeTrue();
    httpTesting.expectOne('/api/v1/products/search?q=riz').flush([]);
    fixture.detectChanges();

    expect(component.hasError()).toBeFalse();
    expect(component.showEmpty()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Aucun produit trouvé');
  }));
});
