import { Component, input } from '@angular/core';

/**
 * Spinner « anneau de points » réutilisable, extrait de loading-overlay.
 *
 * Piloté par la couleur du texte courant (`currentColor`) : il s'adapte
 * automatiquement au thème clair/sombre et au contexte (accent sur fond clair,
 * blanc sur l'overlay sombre). Aucune couleur en dur.
 *
 * - `size`  : diamètre en px (défaut 40).
 * - `label` : texte affiché sous l'anneau (vide = anneau seul, décoratif).
 */
@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.html',
  styleUrl: './spinner.scss',
  host: {
    role: 'status',
    'aria-live': 'polite',
    '[style.--spinner-size.px]': 'size()',
  },
})
export class Spinner {
  readonly size = input(40);
  readonly label = input('');
}
