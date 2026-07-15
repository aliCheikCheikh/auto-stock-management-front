import { Component, computed, input, output } from '@angular/core';
import { PageMeta } from '../../../core/api/page.model';

/**
 * Barre de pagination réutilisable (lecture seule) : Précédent / n° de page /
 * Suivant. Émet l'index de page cible ; toute la logique de données reste dans
 * la page hôte (qui appelle son propre goToPage).
 */
@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class Pagination {
  readonly meta = input.required<PageMeta>();
  readonly goTo = output<number>();

  readonly current = computed(() => this.meta().page);
  readonly total = computed(() => this.meta().totalPages);
  readonly hasPrev = computed(() => this.current() > 0);
  readonly hasNext = computed(() => this.current() + 1 < this.total());

  prev(): void {
    if (this.hasPrev()) {
      this.goTo.emit(this.current() - 1);
    }
  }

  next(): void {
    if (this.hasNext()) {
      this.goTo.emit(this.current() + 1);
    }
  }
}
