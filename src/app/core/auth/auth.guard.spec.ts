import { TestBed } from "@angular/core/testing";
import { authGuard, forcePasswordChangeGuard, ownerGuard } from './auth.guard'
import { AuthService } from "./auth.service";
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Observable, of, throwError } from "rxjs";


describe('authGuard', () => {
    const runGuard = () =>
        TestBed.runInInjectionContext(() =>
            authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    it('laisse passer (true) un utilisateur déjà connu, sans appeler me()', () => {
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: { currentUser: () => ({ userId: '1', role: 'OWNER' }) } },
                provideRouter([]),
            ],
        });

        expect(runGuard()).toBe(true);
    });

    it('utilisateur temporaire → redirige vers /change-password', () => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        currentUser: () => ({ userId: '1', role: 'OWNER', passwordTemporary: true }),
                    },
                },
                provideRouter([]),
            ],
        });

        const result = runGuard();
        expect(result instanceof UrlTree).toBe(true);
        expect((result as UrlTree).toString()).toBe('/change-password');
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

describe('ownerGuard', () => {
    const runGuard = () =>
        TestBed.runInInjectionContext(() =>
            ownerGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    it('redirige un vendeur vers le catalogue', () => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        currentUser: () => ({
                            userId: 'seller-1',
                            role: 'SELLER',
                            passwordTemporary: false,
                        }),
                    },
                },
                provideRouter([]),
            ],
        });

        const result = runGuard();
        expect(result instanceof UrlTree).toBe(true);
        expect((result as UrlTree).toString()).toBe('/products');
    });
});

describe('forcePasswordChangeGuard', () => {
    const runGuard = () =>
        TestBed.runInInjectionContext(() =>
            forcePasswordChangeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    it('laisse uniquement passer un compte dont le mot de passe est temporaire', () => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        currentUser: () => ({
                            userId: 'seller-1',
                            role: 'SELLER',
                            passwordTemporary: true,
                        }),
                    },
                },
                provideRouter([]),
            ],
        });

        expect(runGuard()).toBe(true);
    });

    it('redirige un compte déjà régularisé vers le catalogue', () => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        currentUser: () => ({
                            userId: 'seller-1',
                            role: 'SELLER',
                            passwordTemporary: false,
                        }),
                    },
                },
                provideRouter([]),
            ],
        });

        const result = runGuard();
        expect(result instanceof UrlTree).toBeTrue();
        expect((result as UrlTree).toString()).toBe('/products');
    });

    it('redirige un propriétaire déjà régularisé vers le tableau de bord', () => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        currentUser: () => ({
                            userId: 'owner-1',
                            role: 'OWNER',
                            passwordTemporary: false,
                        }),
                    },
                },
                provideRouter([]),
            ],
        });

        const result = runGuard();
        expect(result instanceof UrlTree).toBeTrue();
        expect((result as UrlTree).toString()).toBe('/dashboard');
    });
});
