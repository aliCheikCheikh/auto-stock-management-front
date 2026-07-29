import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProductsApiService } from './products-api.service';

describe('ProductsApiService', () => {
  let service: ProductsApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductsApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('transmet la page demandée au catalogue', () => {
    service.listProducts(true, 20, 2).subscribe();

    const request = httpTesting.expectOne(
      (candidate) => candidate.url === '/api/v1/products'
    );
    expect(request.request.params.get('activeOnly')).toBe('true');
    expect(request.request.params.get('size')).toBe('20');
    expect(request.request.params.get('page')).toBe('2');
    request.flush({
      content: [],
      page: { page: 2, size: 20, totalElements: 41, totalPages: 3 },
    });
  });
});
