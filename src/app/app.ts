import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { ToastContainer } from './core/notifications/toast-container/toast-container';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly showChrome = signal(true);
  private readonly router = inject(Router)
  private readonly authService = inject(AuthService);
  constructor() {
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => {
      this.showChrome.set(!this.router.url.includes('/login'));
    })
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login'])
    })
  }
}
