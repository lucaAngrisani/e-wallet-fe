import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  NoPreloading,
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
} from '@angular/router';

import {
  provideNativeDateAdapter,
  MAT_DATE_LOCALE,
} from '@angular/material/core';

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { HttpClient, provideHttpClient } from '@angular/common/http';
import { initApp } from './functions/init.function';
import { SessionStore } from './stores/session.store';

import { appRoutes } from './router/app.routes';
import { CurrencySymbolsService } from './services/currency-symbols.service';
import { ApiService } from './pages/settings/services/api.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),

    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withPreloading(isDevMode() ? NoPreloading : PreloadAllModules)
    ),

    provideHttpClient(),

    provideTranslateService({
      lang: 'it',
      fallbackLang: 'it',
      loader: provideTranslateHttpLoader({
        prefix: 'assets/i18n/',
        suffix: '.json',
      }),
    }),

    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'it-IT' },

    provideAppInitializer(() => {
      const api = inject(ApiService);
      const session = inject(SessionStore);
      const css = inject(CurrencySymbolsService);

      session.hydrate();

      initApp(css, api);
    }),
  ],
};
