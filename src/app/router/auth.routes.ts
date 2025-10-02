import { Routes } from '@angular/router';
import { ROUTE } from './routes/route';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: `${ROUTE.AUTH.HOME}`,
    pathMatch: 'full',
  },
  {
    path: ROUTE.AUTH.HOME,
    loadComponent: () => import('../pages/dashboard/dashboard.component'),
  },
  {
    path: ROUTE.AUTH.PROFILE,
    loadComponent: () => import('../pages/profile/profile.component'),
  },
  {
    path: ROUTE.AUTH.ACCOUNT_LIST,
    loadComponent: () =>
      import('../pages/account/account-list/account-list.component'),
  },
  {
    path: ROUTE.AUTH.ACCOUNT_NEW,
    loadComponent: () =>
      import('../pages/account/account-edit/account-edit.component'),
  },
  {
    path: `${ROUTE.AUTH.ACCOUNT_EDIT}/:id`,
    loadComponent: () =>
      import('../pages/account/account-edit/account-edit.component'),
  },
  {
    path: `${ROUTE.AUTH.ACCOUNT_DETAIL}/:id`,
    loadComponent: () =>
      import('../pages/account/account-detail/account-detail.component'),
  },
  {
    path: ROUTE.AUTH.TRANSACTION_LIST,
    loadComponent: () =>
      import(
        '../pages/transaction/transaction-list/transaction-list.component'
      ),
  },
  {
    path: ROUTE.AUTH.TRANSACTION_NEW,
    loadComponent: () =>
      import(
        '../pages/transaction/transaction-edit/transaction-edit.component'
      ),
  },
  {
    path: `${ROUTE.AUTH.TRANSACTION_EDIT}/:id`,
    loadComponent: () =>
      import(
        '../pages/transaction/transaction-edit/transaction-edit.component'
      ),
  },
  {
    path: `${ROUTE.AUTH.TRANSACTION_DETAIL}/:id`,
    loadComponent: () =>
      import(
        '../pages/transaction/transaction-detail/transaction-detail.component'
      ),
  },
  {
    path: ROUTE.AUTH.PLAN_LIST,
    loadComponent: () => import('../pages/plan/plan-list/plan-list.component'),
  },
  {
    path: ROUTE.AUTH.PLAN_NEW,
    loadComponent: () => import('../pages/plan/plan-edit/plan-edit.component'),
  },
  {
    path: `${ROUTE.AUTH.PLAN_EDIT}/:id`,
    loadComponent: () => import('../pages/plan/plan-edit/plan-edit.component'),
  },
  {
    path: `${ROUTE.AUTH.PLAN_DETAIL}/:id`,
    loadComponent: () =>
      import('../pages/plan/plan-detail/plan-detail.component'),
  },
  {
    path: ROUTE.AUTH.SETTINGS,
    loadComponent: () => import('../pages/settings/settings.component'),
  },
  { path: '**', redirectTo: ROUTE.AUTH.HOME },
];
