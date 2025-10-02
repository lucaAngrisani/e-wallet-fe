import { Routes } from '@angular/router';
import { ROUTE } from './routes/route';

export const publicRoutes: Routes = [
  {
    path: '',
    redirectTo: `${ROUTE.PUBLIC.HOME}`,
    pathMatch: 'full',
  },
  {
    path: ROUTE.PUBLIC.LOGIN,
    loadComponent: () => import('../pages/login/login.component'),
  },
  { path: '**', redirectTo: ROUTE.PUBLIC.HOME },
];
