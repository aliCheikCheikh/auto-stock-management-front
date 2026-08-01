import { Component, input } from '@angular/core';

/**
 * Squelette de liste : occupe la place des lignes à venir pour que l'arrivée
 * des données ne fasse pas sauter la mise en page.
 */
@Component({
  selector: 'app-debt-list-skeleton',
  templateUrl: './debt-list-skeleton.html',
  styleUrl: './debt-list-skeleton.scss',
  host: { 'aria-hidden': 'true' },
})
export class DebtListSkeleton {
  readonly rows = input(5);

  get placeholders(): readonly number[] {
    return Array.from({ length: this.rows() }, (_, index) => index);
  }
}
