import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, type CanActivateFn } from '@angular/router';
import { SessionStore } from '../stores/session.store';
import { ROUTE } from '../router/routes/route';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router: Router = inject(Router);
  const store = inject(SessionStore);

  if (store.isLoggedIn()) {
    return true;
  } else {
    router.navigate([ROUTE.PUBLIC]);
    return false;
  }
};
