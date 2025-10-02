import { Injectable, signal, WritableSignal } from '@angular/core';
import { MenuItem } from '../shared/menu-item.interface';
import { ROUTE_AUTH } from '../router/routes/route.auth';

@Injectable({ providedIn: 'root' })
export class MenuService {

  menuItemList: WritableSignal<MenuItem[]> = signal([]);

  constructor() {
    this.menuItemList.set([
      { label: 'menu.home', route: `/${ROUTE_AUTH.BASE_PATH}/${ROUTE_AUTH.HOME}`, icon: 'home', order: 1 },
      { label: 'menu.profile', route: `/${ROUTE_AUTH.BASE_PATH}/${ROUTE_AUTH.PROFILE}`, icon: 'person', order: 2 },
      { label: 'menu.account-list', route: `/${ROUTE_AUTH.BASE_PATH}/${ROUTE_AUTH.ACCOUNT_LIST}`, icon: 'account_balance', order: 3 },
      { label: 'menu.transaction-list', route: `/${ROUTE_AUTH.BASE_PATH}/${ROUTE_AUTH.TRANSACTION_LIST}`, icon: 'list_alt', order: 4 },
      { label: 'menu.plan-list', route: `/${ROUTE_AUTH.BASE_PATH}/${ROUTE_AUTH.PLAN_LIST}`, icon: 'event_note', order: 5 },
      { label: 'menu.settings', route: `/${ROUTE_AUTH.BASE_PATH}/${ROUTE_AUTH.SETTINGS}`, icon: 'settings', order: 6 },
    ]);
  }

}
