import { TestBed } from "@angular/core/testing";
import { authGuard } from './auth.guard'
import { AuthService } from "./auth.service";
import { provideRouter, UrlTree } from "@angular/router";
import { Observable, of, throwError } from "rxjs";


describe('authGuard', () => {
    const runGuard = () =>
        TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

    it('laisse passer (true) un utilisateur déjà connu, sans appeler me()', () => {
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: { currentUser: () => ({ userId: '1', role: 'OWNER' }) } },
                provideRouter([]),
            ],
        });

        expect(runGuard()).toBe(true);
    });

    it('utilisateur inconnu + me() réussit → laisse passer (true)', (done) => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        currentUser: () => null,
                        me: () => of({ userId: '1', role: 'OWNER' }),
                    },
                },
                provideRouter([]),
            ],
        });

        (runGuard() as Observable<boolean | UrlTree>).subscribe((result) => {
            expect(result).toBe(true);
            done();
        });
    });

    it('utilisateur inconnu + me() échoue (401) → redirige vers /login', (done) => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        currentUser: () => null,
                        me: () => throwError(() => new Error('401')),
                    },
                },
                provideRouter([]),
            ],
        });

        (runGuard() as Observable<boolean | UrlTree>).subscribe((result) => {
            expect(result instanceof UrlTree).toBe(true);
            expect((result as UrlTree).toString()).toBe('/login');
            done();
        });
    });
});
