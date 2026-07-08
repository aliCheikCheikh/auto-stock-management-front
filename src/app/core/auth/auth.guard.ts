import { inject } from "@angular/core";
import { CanActivateFn, Router, UrlTree } from "@angular/router";
import { AuthService } from "./auth.service";
import { AuthenticatedUser } from "./auth.model";
import { catchError, map, of } from "rxjs";

// Routes métier : il faut être authentifié ET ne pas avoir de mot de passe temporaire.
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const decide = (user: AuthenticatedUser | null): boolean | UrlTree => {
        if (user === null) {
            return router.createUrlTree(['/login']);
        }
        if (user.passwordTemporary) {
            return router.createUrlTree(['/change-password']);
        }
        return true;
    };

    const cached = authService.currentUser();
    if (cached !== null) {
        return decide(cached);
    }

    return authService.me().pipe(
        map(decide),
        catchError(() => of(router.createUrlTree(['/login'])))
    );
};

// Écran de changement forcé : réservé aux utilisateurs authentifiés dont le mot de
// passe est encore temporaire. Sinon, on les renvoie vers l'application.
export const forcePasswordChangeGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const decide = (user: AuthenticatedUser | null): boolean | UrlTree => {
        if (user === null) {
            return router.createUrlTree(['/login']);
        }
        if (!user.passwordTemporary) {
            return router.createUrlTree(['/products']);
        }
        return true;
    };

    const cached = authService.currentUser();
    if (cached !== null) {
        return decide(cached);
    }

    return authService.me().pipe(
        map(decide),
        catchError(() => of(router.createUrlTree(['/login'])))
    );
};
