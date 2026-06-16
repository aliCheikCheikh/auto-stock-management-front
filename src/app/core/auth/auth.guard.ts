import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { catchError, map, of } from "rxjs";

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.currentUser() !== null) {
        return true;
    }

    return authService.me().pipe(
        map(() => true),
        catchError(() => of(router.createUrlTree(['/login'])))
    );
}