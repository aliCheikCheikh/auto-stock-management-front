import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { ToastContainer } from './core/notifications/toast-container/toast-container';
import { LoadingOverlay } from './shared/ui/loading-overlay/loading-overlay';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainer, LoadingOverlay],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly showChrome = signal(true);
  private readonly router = inject(Router)
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  readonly theme = this.themeService.theme;
  // Lien « Administration » réservé à l'OWNER.
  readonly isOwner = computed(() => this.authService.currentUser()?.role === 'OWNER');
  readonly currentUser = this.authService.currentUser;
  readonly userMenuOpen = signal(false);
  // Reflète l'état plein écran pour basculer l'icône du bouton.
  readonly isFullscreen = signal(false);
  constructor() {
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => {
      this.showChrome.set(!this.router.url.includes('/login'));
      this.userMenuOpen.set(false);
    })
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  // Bascule le plein écran navigateur (API Fullscreen). L'icône suit l'état réel
  // via l'événement fullscreenchange (échap système compris).
  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  }

  @HostListener('document:fullscreenchange')
  syncFullscreen() {
    this.isFullscreen.set(!!document.fullscreenElement);
  }

  // Raccourci « / » : place le focus sur la recherche produit.
  // Point d'accroche : le champ marqué [data-global-search] (la barre arrive
  // dans un chantier suivant). Ignoré pendant la saisie dans un champ.
  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent) {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (isEditableTarget(event.target)) {
      return;
    }
    const search = document.querySelector<HTMLInputElement>('[data-global-search]');
    if (search) {
      event.preventDefault();
      search.focus();
    }
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.userMenuOpen.update((open) => !open);
  }

  // Ferme le menu sur un clic ailleurs ou sur la touche Échap.
  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  closeUserMenu() {
    this.userMenuOpen.set(false);
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login'])
    })
  }
}

// Vrai si l'utilisateur est en train de saisir (input/textarea/select ou zone
// éditable) : on ne détourne pas la touche « / » dans ces cas.
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) {
    return false;
  }
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}
