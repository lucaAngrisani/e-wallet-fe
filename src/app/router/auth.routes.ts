import { Routes } from '@angular/router';
import { ROUTE } from './routes/route';
import { TranslateService } from '@ngx-translate/core';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: `${ROUTE.AUTH.HOME}`,
    pathMatch: 'full',
  },
  {
    path: ROUTE.AUTH.HOME,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.DASHBOARD`));
    },
    loadComponent: () => import('../pages/dashboard/dashboard.component'),
  },
  {
    path: ROUTE.AUTH.PROFILE,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.PROFILE`));
    },
    loadComponent: () => import('../pages/profile/profile.component'),
  },
  {
    path: ROUTE.AUTH.ACCOUNT_LIST,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.ACCOUNT_LIST`));
    },
    loadComponent: () =>
      import('../pages/account/account-list/account-list.component'),
  },
  {
    path: ROUTE.AUTH.ACCOUNT_NEW,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.ACCOUNT_NEW`));
    },
    loadComponent: () =>
      import('../pages/account/account-edit/account-edit.component'),
  },
  {
    path: `${ROUTE.AUTH.ACCOUNT_EDIT}/:id`,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.ACCOUNT_EDIT`));
    },
    loadComponent: () =>
      import('../pages/account/account-edit/account-edit.component'),
  },
  {
    path: `${ROUTE.AUTH.ACCOUNT_DETAIL}/:id`,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.ACCOUNT_DETAIL`));
    },
    loadComponent: () =>
      import('../pages/account/account-detail/account-detail.component'),
  },
  {
    path: ROUTE.AUTH.TRANSACTION_LIST,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.TRANSACTION_LIST`));
    },
    loadComponent: () =>
      import(
        '../pages/transaction/transaction-list/transaction-list.component'
      ),
  },
  {
    path: ROUTE.AUTH.TRANSACTION_NEW,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.TRANSACTION_NEW`));
    },
    loadComponent: () =>
      import(
        '../pages/transaction/transaction-edit/transaction-edit.component'
      ),
  },
  {
    path: `${ROUTE.AUTH.TRANSACTION_NEW_ACCOUNT}/:accountId`,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.TRANSACTION_NEW`));
    },
    loadComponent: () =>
      import(
        '../pages/transaction/transaction-edit/transaction-edit.component'
      ),
  },
  {
    path: `${ROUTE.AUTH.TRANSACTION_EDIT}/:id`,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.TRANSACTION_EDIT`));
    },
    loadComponent: () =>
      import(
        '../pages/transaction/transaction-edit/transaction-edit.component'
      ),
  },
  {
    path: `${ROUTE.AUTH.TRANSACTION_EDIT_ACCOUNT}/:accountId/:id`,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.TRANSACTION_EDIT`));
    },
    loadComponent: () =>
      import(
        '../pages/transaction/transaction-edit/transaction-edit.component'
      ),
  },
  {
    path: `${ROUTE.AUTH.TRANSACTION_DETAIL}/:id`,
    title: (route) => {
      const translate = inject(TranslateService);
      return translate.instant(`title.TRANSACTION_DETAIL`);
    },
    loadComponent: () =>
      import(
        '../pages/transaction/transaction-detail/transaction-detail.component'
      ),
  },
  {
    path: ROUTE.AUTH.PLAN_LIST,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.PLAN_LIST`));
    },
    loadComponent: () => import('../pages/plan/plan-list/plan-list.component'),
  },
  {
    path: ROUTE.AUTH.PLAN_NEW,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.PLAN_NEW`));
    },
    loadComponent: () => import('../pages/plan/plan-edit/plan-edit.component'),
  },
  {
    path: `${ROUTE.AUTH.PLAN_EDIT}/:id`,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.PLAN_EDIT`));
    },
    loadComponent: () => import('../pages/plan/plan-edit/plan-edit.component'),
  },
  {
    path: `${ROUTE.AUTH.PLAN_DETAIL}/:id`,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.PLAN_DETAIL`));
    },
    loadComponent: () =>
      import('../pages/plan/plan-detail/plan-detail.component'),
  },
  {
    path: ROUTE.AUTH.SETTINGS,
    title: async () => {
      const translate = inject(TranslateService);
      return await firstValueFrom(translate.get(`title.SETTINGS`));
    },
    loadComponent: () => import('../pages/settings/settings.component'),
  },
  { path: '**', redirectTo: ROUTE.AUTH.HOME },
];
