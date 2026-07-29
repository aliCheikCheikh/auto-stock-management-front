import { computed, Signal, signal } from '@angular/core';
import { PageMeta } from '../../core/api/page.model';

// Au-delà de ce nombre d'éléments, une liste devient illisible d'un bloc.
// En dessous, aucun contrôle n'est affiché : on n'encombre pas un écran qui
// n'en a pas besoin.
export const LOCAL_PAGE_SIZE = 20;

export interface LocalPagination<T> {
  /** Éléments de la page courante. */
  readonly items: Signal<readonly T[]>;
  /** Métadonnées attendues par `app-pagination`. */
  readonly meta: Signal<PageMeta>;
  /** Vrai seulement au-delà du seuil : conditionne l'affichage des contrôles. */
  readonly isPaginated: Signal<boolean>;
  goTo(index: number): void;
  reset(): void;
}

/**
 * Pagination côté client pour les listes issues d'un endpoint **non paginé**
 * (familles de pièces, comptes utilisateurs). Les listes déjà paginées côté
 * serveur gardent leur pagination serveur.
 *
 * La position survit à un rechargement des données : l'index n'est pas remis à
 * zéro, il est seulement ramené dans les bornes si la liste a raccourci.
 */
export function createLocalPagination<T>(
  source: Signal<readonly T[]>,
  size = LOCAL_PAGE_SIZE
): LocalPagination<T> {
  const requested = signal(0);

  const totalPages = computed(() => Math.max(1, Math.ceil(source().length / size)));
  const current = computed(() => Math.min(Math.max(requested(), 0), totalPages() - 1));

  const meta = computed<PageMeta>(() => ({
    page: current(),
    size,
    totalElements: source().length,
    totalPages: totalPages(),
  }));

  const items = computed(() => source().slice(current() * size, current() * size + size));

  return {
    items,
    meta,
    isPaginated: computed(() => source().length > size),
    goTo: (index: number) => requested.set(index),
    reset: () => requested.set(0),
  };
}
