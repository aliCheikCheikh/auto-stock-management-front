import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { ToastContainer } from './core/notifications/toast-container/toast-container';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainer],
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
