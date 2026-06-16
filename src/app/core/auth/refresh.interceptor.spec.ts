import { HttpClient, provideHttpClient, withInterceptors } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { refreshInterceptor } from "./refresh.interceptor";
import { provideRouter, Router } from "@angular/router";


describe('refreshInterceptor', () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([refreshInterceptor])),
                provideHttpClientTesting(),
                provideRouter([]),
            ],
        });
        http = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('sur un 401, rafraîchit puis rejoue la requête', () => {
        let result: unknown;
        http.get('/api/v1/products').subscribe((res) => (result = res));

        // 1. la 1ère requête reçoit un 401
        httpMock.expectOne('/api/v1/products')
            .flush(null, { status: 401, statusText: 'Unauthorized' });

        // 2. l'intercepteur déclenche le refresh → on le fait réussir
        const refreshReq = httpMock.expectOne('/api/v1/auth/refresh');
        expect(refreshReq.request.method).toBe('POST');
        refreshReq.flush(null);

        // 3. la requête d'origine est rejouée → on répond 200
        httpMock.expectOne('/api/v1/products').flush({ ok: true });

        // 4. le composant reçoit bien les données du rejeu
        expect(result).toEqual({ ok: true });
    });

    it('si le refresh échoue, redirige vers /login et propage l\'erreur', () => {
        const router = TestBed.inject(Router);
        const navSpy = spyOn(router, 'navigateByUrl');
        let errored = false;
        http.get('/api/v1/products').subscribe(
            {
                error: () => (errored = true)
            }
        );
        httpMock.expectOne('/api/v1/products')
            .flush(null, { status: 401, statusText: 'Unauthorized' });
        httpMock.expectOne('/api/v1/auth/refresh')
            .flush(null, { status: 401, statusText: 'Unauthorized' });
        expect(navSpy).toHaveBeenCalledWith('/login');
        expect(errored).toBe(true);

    })
});