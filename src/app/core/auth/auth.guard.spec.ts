import { TestBed } from "@angular/core/testing";
import { authGuard } from './auth.guard'
import { AuthService } from "./auth.service";
import { provideRouter, UrlTree } from "@angular/router";



describe('authGuard', () => {
    const runGuard = () =>
        TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    it('laisse passer un utilisateur connecté', () => {
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: { currentUser: () => ({ userId: '1', role: 'OWNER' }) } },
                provideRouter([]),
            ],
        });
        expect(runGuard()).toBe(true)
    });

    it('redirige un utilisateur non connecté vers /login', () => {
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: { currentUser: () => null } },
                provideRouter([]),

            ],
        });
        const result = runGuard();
        expect(result instanceof UrlTree).toBe(true);
        expect((result as UrlTree).toString()).toBe('/login');
    });
});