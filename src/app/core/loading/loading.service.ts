import { Injectable, computed, signal } from '@angular/core';

/**
 * État de chargement global, réutilisable.
 *
 * Deux niveaux distincts, volontairement séparés :
 *  - `pending`  : requêtes HTTP en cours (rafraîchissements de fond).
 *                 → indicateur DISCRET (barre fine en haut), non bloquant.
 *  - `blocking` : action explicite de l'utilisateur (soumission de formulaire,
 *                 chargement d'écran).
 *                 → overlay CENTRÉ bloquant (spinner + fond flouté).
 *
 * Chaque niveau est un compteur : plusieurs opérations concurrentes ne se
 * masquent pas prématurément l'une l'autre.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _pending = signal(0);
  private readonly _blocking = signal(0);

  /** Au moins une requête HTTP de fond est en cours. */
  readonly pending = computed(() => this._pending() > 0);
  /** Au moins une action bloquante est en cours. */
  readonly blocking = computed(() => this._blocking() > 0);

  startRequest(): void {
    this._pending.update((n) => n + 1);
  }

  endRequest(): void {
    this._pending.update((n) => Math.max(0, n - 1));
  }

  startBlocking(): void {
    this._blocking.update((n) => n + 1);
  }

  stopBlocking(): void {
    this._blocking.update((n) => Math.max(0, n - 1));
  }
}
