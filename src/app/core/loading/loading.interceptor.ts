import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from './loading.service';

/**
 * Alimente l'indicateur de fond (barre fine en haut) pour toute requête HTTP.
 * Non bloquant : l'overlay centré est piloté à part par les écrans/actions via
 * LoadingService.startBlocking() / stopBlocking().
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  loading.startRequest();
  return next(req).pipe(finalize(() => loading.endRequest()));
};
