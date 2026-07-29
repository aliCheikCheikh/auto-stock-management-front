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
        httpMock.expectOne('/api/v1/auth/me').flush({
            userId: '1',
            displayName: 'Ali Cheikh',
            email: 'ali@example.com',
            role: 'OWNER',
            passwordTemporary: false,
        });
        expect(service.currentUser()).not.toBeNull();

        service.logout().subscribe();
        const req = httpMock.expectOne('/api/v1/auth/logout');
        expect(req.request.method).toBe('POST');
        req.flush(null);

        expect(service.currentUser()).toBeNull();
    });

    it('envoie le changement de mot de passe sans inventer le nouvel état de session', () => {
        service.changePassword({ currentPassword: 'Temporaire1', newPassword: 'NouveauSecret1' })
            .subscribe();

        const changeRequest = httpMock.expectOne('/api/v1/auth/change-password');
        expect(changeRequest.request.method).toBe('POST');
        expect(changeRequest.request.body).toEqual({
            currentPassword: 'Temporaire1',
            newPassword: 'NouveauSecret1',
        });
        changeRequest.flush(null);
        expect(service.currentUser()).toBeNull();
    });
});
