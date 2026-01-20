import { Component, inject, computed } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MenuService } from '../../services/menu.service';
import { TranslateModule } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { ROUTE } from '../../router/routes/route';
import { SessionStore } from '../../stores/session.store';
import { THEME } from '../../enums/theme.enum';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-base-layout',
  templateUrl: './base-layout.component.html',
  imports: [
    RouterLink,
    RouterOutlet,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
    MatSidenavModule,
    MatToolbarModule,
  ],
})
export default class BaseLayoutComponent {
  ROUTE = ROUTE;

  THEME_DARK = THEME.DARK;
  THEME_LIGHT = THEME.LIGHT;

  sessionStore = inject(SessionStore);
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);

  isSmallScreen = toSignal(
    this.breakpointObserver
      .observe('(max-width: 800px)')
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  showAddButton = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.url.includes(ROUTE.AUTH.HOME))
    ),
    {
      initialValue: this.router.url.includes(ROUTE.AUTH.HOME),
    }
  );

  sidenavMode = computed(() => (this.isSmallScreen() ? 'over' : 'side'));
  sidenavOpened = computed(() => !this.isSmallScreen());

  readonly routeTitle$ = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => {
        let r: ActivatedRoute | null = this.router.routerState.root;
        while (r?.firstChild) r = r.firstChild;
        return r?.snapshot.title ?? r?.snapshot.data?.['title'] ?? null;
      }),
      startWith(() => {
        let r: ActivatedRoute | null = this.router.routerState.root;
        while (r?.firstChild) r = r.firstChild;
        return r?.snapshot.title ?? r?.snapshot.data?.['title'] ?? null;
      }),
    ),
    { initialValue: null as string | null },
  );

  constructor(public menuSvc: MenuService) {}
}
