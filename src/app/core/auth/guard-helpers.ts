import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthenticatedUser } from './auth.model';

type Decision = boolean | UrlTree;

/**
 * Construit une garde à partir d'une règle de décision.
 *
 * L'utilisateur courant est résolu de façon synchrone s'il est déjà connu
 * (signal), sinon de façon asynchrone via /me. Si /me échoue, on redirige
 * vers /login. Ça évite de dupliquer ce branchement dans chaque garde.
 */
export function guardFromDecision(
  decide: (user: AuthenticatedUser | null, router: Router) => Decision
): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const cached = authService.currentUser();
    if (cached !== null) {
      return decide(cached, router);
    }

    return authService.me().pipe(
      map((user) => decide(user, router)),
      catchError(() => of(router.createUrlTree(['/login'])))
    );
  };
}
