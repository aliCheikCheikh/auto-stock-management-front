import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { LocationType, SessionContext } from './context.model';

/**
 * Charge et met en cache le contexte de session (magasin + emplacements) depuis
 * le serveur. Le front n'invente plus d'identifiants : il les reçoit d'ici.
 *
 * `ensureLoaded()` est idempotent : le contexte n'est chargé qu'une fois, et les
 * appels concurrents partagent la même requête (shareReplay).
 */
@Injectable({ providedIn: 'root' })
export class SessionContextService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1';

  private readonly _context = signal<SessionContext | null>(null);
  readonly context = this._context.asReadonly();

  private inFlight$: Observable<SessionContext> | null = null;

  ensureLoaded(): Observable<SessionContext> {
    const cached = this._context();
    if (cached) {
      return of(cached);
    }

    if (!this.inFlight$) {
      this.inFlight$ = this.http.get<SessionContext>(`${this.apiUrl}/context`).pipe(
        tap((context) => this._context.set(context)),
        shareReplay(1),
      );
    }

    return this.inFlight$;
  }

  /** Identifiant réel d'un emplacement par son type (SHOP_FLOOR / BACKSTOCK). */
  locationIdByType(type: LocationType): string | undefined {
    return this._context()?.locations.find((location) => location.type === type)?.locationId;
  }

  /** À appeler à la déconnexion pour forcer un rechargement à la prochaine session. */
  clear(): void {
    this._context.set(null);
    this.inFlight$ = null;
  }
}
