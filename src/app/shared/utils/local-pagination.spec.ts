import { signal } from '@angular/core';
import { createLocalPagination, LOCAL_PAGE_SIZE } from './local-pagination';

function items(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `item-${index}`);
}

describe('createLocalPagination', () => {
  it('n’affiche aucun contrôle en deçà du seuil', () => {
    const source = signal(items(8));
    const pagination = createLocalPagination(source);

    expect(pagination.isPaginated()).toBeFalse();
    expect(pagination.meta().totalPages).toBe(1);
    expect(pagination.items().length).toBe(8);
  });

  it('n’affiche aucun contrôle à exactement 20 éléments', () => {
    const pagination = createLocalPagination(signal(items(LOCAL_PAGE_SIZE)));

    expect(pagination.isPaginated()).toBeFalse();
    expect(pagination.meta().totalPages).toBe(1);
  });

  it('découpe une liste de 25 en deux pages', () => {
    const pagination = createLocalPagination(signal(items(25)));

    expect(pagination.isPaginated()).toBeTrue();
    expect(pagination.meta().totalPages).toBe(2);
    expect(pagination.items().length).toBe(20);

    pagination.goTo(1);
    expect(pagination.items()).toEqual(['item-20', 'item-21', 'item-22', 'item-23', 'item-24']);
  });

  it('conserve la position quand les données sont rechargées', () => {
    const source = signal(items(45));
    const pagination = createLocalPagination(source);

    pagination.goTo(1);
    source.set(items(44)); // un élément supprimé ailleurs

    expect(pagination.meta().page).toBe(1);
  });

  it('ramène dans les bornes quand la page courante disparaît', () => {
    const source = signal(items(45));
    const pagination = createLocalPagination(source);

    pagination.goTo(2);
    expect(pagination.meta().page).toBe(2);

    source.set(items(21));
    expect(pagination.meta().page).toBe(1);
    expect(pagination.items().length).toBe(1);
  });
});
