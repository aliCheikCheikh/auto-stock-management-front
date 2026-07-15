import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductSearch } from './product-search';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('ProductSearch', () => {
  let component: ProductSearch;
  let fixture: ComponentFixture<ProductSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductSearch],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
