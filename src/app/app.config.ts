import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { credentialsInterceptor } from './core/auth/credentials.interceptor';
import { AuthService } from './core/auth/auth.service';
import { catchError, of } from 'rxjs';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([credentialsInterceptor])),
    provideRouter(routes),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      return authService.me().pipe(
        catchError(() => of(null))
      );
})
  ]
};
