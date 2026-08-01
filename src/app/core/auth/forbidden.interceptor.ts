import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../notifications/notification.service';

// Écran d'atterrissage autorisé à tout compte authentifié.
const FALLBACK_ROUTE = '/products';

/**
 * Un `403` signifie que le compte n'a pas le droit d'être là — rôle changé
 * depuis la connexion, ou URL collée à la main par un vendeur. Cacher l'entrée
 * de menu ne suffit pas : on le ramène sur un écran autorisé en le disant,
 * plutôt que de le laisser devant une page en erreur.
 */
export const forbiddenInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const notifications = inject(NotificationService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 403) {
        notifications.error('Cet écran est réservé au propriétaire du magasin.');
        void router.navigateByUrl(FALLBACK_ROUTE);
      }
      return throwError(() => error);
    })
  );
};
