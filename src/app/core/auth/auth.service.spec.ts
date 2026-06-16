import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { inject } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { AuthService } from "./auth.service";


describe('AuthService.logout', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('appelle POST /auth/logout et vide la session', () => {
        service.me().subscribe();
        httpMock.expectOne('/api/v1/auth/me').flush({ userId: '1', role: 'OWNER' });
        expect(service.currentUser()).not.toBeNull();

        service.logout().subscribe();
        const req = httpMock.expectOne('/api/v1/auth/logout');
        expect(req.request.method).toBe('POST');
        req.flush(null);

        expect(service.currentUser()).toBeNull();
    });
});
