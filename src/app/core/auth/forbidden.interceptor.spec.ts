import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { forbiddenInterceptor } from './forbidden.interceptor';

describe('forbiddenInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([forbiddenInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('ramène sur un écran autorisé quand le serveur refuse l’accès', () => {
    // Un vendeur qui colle une URL de créances doit atterrir proprement.
    http.get('/api/v1/debts').subscribe({ error: () => undefined });

    httpTesting
      .expectOne('/api/v1/debts')
      .flush({ code: 'FORBIDDEN' }, { status: 403, statusText: 'Forbidden' });

    expect(router.navigateByUrl).toHaveBeenCalledWith('/products');
  });

  it('laisse passer les autres erreurs sans rediriger', () => {
    http.get('/api/v1/debts/unknown').subscribe({ error: () => undefined });

    httpTesting
      .expectOne('/api/v1/debts/unknown')
      .flush({ code: 'SALE_NOT_FOUND' }, { status: 404, statusText: 'Not Found' });

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
