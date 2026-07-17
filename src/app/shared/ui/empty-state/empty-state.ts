import { Component, input } from '@angular/core';

export type EmptyIllustration =
  | 'products'
  | 'sales'
  | 'movements'
  | 'sellers'
  | 'search'
  | 'error';

/**
 * État vide illustré, réutilisable : illustration SVG légère (recolorée sur les
 * tokens de la palette, suit le thème clair/sombre) + titre + phrase d'aide +
 * action projetée facultative.
 *
 * Usage :
 *   <app-empty-state illustration="products" title="Aucun produit" text="…">
 *     <a class="btn btn--primary" …>Nouvelle réception</a>
 *   </app-empty-state>
 *
 * L'illustration est décorative (aria-hidden) ; le sens passe par le titre.
 */
@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  readonly illustration = input<EmptyIllustration>('products');
  readonly title = input.required<string>();
  readonly text = input<string>('');
}
