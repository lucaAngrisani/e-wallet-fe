import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MenuService } from '../../services/menu.service';
import { TranslateModule } from '@ngx-translate/core';

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
  constructor(public menuSvc: MenuService) {}
}
