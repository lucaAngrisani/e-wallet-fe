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

import { provideHttpClient } from '@angular/common/http';
import { initApp } from './functions/init.function';
import { SessionStore } from './stores/session.store';

import { appRoutes } from './router/app.routes';
import { CurrencySymbolsService } from './services/currency-symbols.service';
import { ApiService } from './pages/settings/services/api.service';
import { TransactionService } from './pages/transaction/transaction.service';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),

    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:10000', // registra dopo idle/10s
    }),

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
      const transactionService = inject(TransactionService);

      session.hydrate();

      initApp(css, api, transactionService);
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
