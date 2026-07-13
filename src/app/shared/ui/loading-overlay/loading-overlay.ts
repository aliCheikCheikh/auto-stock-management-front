import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/loading/loading.service';

/**
 * Rend les deux indicateurs de chargement globaux :
 *  - barre fine en haut pendant les requêtes de fond (pending) ;
 *  - overlay centré bloquant pendant une action (blocking).
 *
 * À monter une seule fois, à la racine (app.html).
 */
@Component({
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.html',
  styleUrl: './loading-overlay.scss',
})
export class LoadingOverlay {
  protected readonly loading = inject(LoadingService);
}
