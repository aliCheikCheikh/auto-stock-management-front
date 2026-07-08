import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'auto-stock-theme';

/**
 * Gère le thème clair/sombre.
 *
 * Ordre de priorité au démarrage : choix explicite déjà enregistré > préférence
 * du système d'exploitation > clair. Le thème est appliqué sur <html> via
 * l'attribut data-theme="light|dark" ; les couleurs de chaque thème sont définies
 * en CSS (design system) sous [data-theme="dark"].
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>('light');
  readonly theme = this._theme.asReadonly();

  constructor() {
    // Applique le thème initial sans le re-persister (on ne "fige" pas la
    // préférence système tant que l'utilisateur n'a pas choisi lui-même).
    this.applyTheme(this.resolveInitialTheme(), false);
  }

  toggle(): void {
    this.applyTheme(this._theme() === 'dark' ? 'light' : 'dark', true);
  }

  setTheme(theme: Theme): void {
    this.applyTheme(theme, true);
  }

  private applyTheme(theme: Theme, persist: boolean): void {
    this._theme.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }

  private resolveInitialTheme(): Theme {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    return prefersDark ? 'dark' : 'light';
  }
}
