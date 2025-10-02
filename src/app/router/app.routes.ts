import { Routes } from '@angular/router';
import { publicRoutes } from './public.routes';
import { authGuard } from '../guards/auth.guard';
import { ROUTE } from './routes/route';
import { authRoutes } from './auth.routes';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: `${ROUTE.AUTH.BASE_PATH}`,
    pathMatch: 'full',
  },
  {
    path: ROUTE.PUBLIC.BASE_PATH,
    loadComponent: () => import('../pages/login/login.component'),
    children: publicRoutes,
  },
  {
    path: ROUTE.AUTH.BASE_PATH,
    canActivate: [authGuard],
    loadComponent: () => import('../layouts/base-layout/base-layout.component'),
    children: authRoutes,
  },
  { path: '**', redirectTo: ROUTE.AUTH.BASE_PATH },
];
