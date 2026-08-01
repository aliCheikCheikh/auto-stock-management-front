import { ApplicationConfig, inject, LOCALE_ID, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

// Interface entièrement en français : les dates doivent l'être aussi. Sans
// cela, DatePipe rend « 20 Jul 2026 » au milieu d'un écran francophone.
registerLocaleData(localeFr);

import { routes } from './app.routes';
import { credentialsInterceptor } from './core/auth/credentials.interceptor';
import { refreshInterceptor } from './core/auth/refresh.interceptor';
import { forbiddenInterceptor } from './core/auth/forbidden.interceptor';
import { loadingInterceptor } from './core/loading/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([
      loadingInterceptor,
      refreshInterceptor,
      forbiddenInterceptor,
      credentialsInterceptor,
    ])),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
  ]
};
