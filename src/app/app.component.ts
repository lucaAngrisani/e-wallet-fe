import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionStore } from './stores/session.store';
import { THEME } from './enums/theme.enum';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  sessionStore = inject(SessionStore);

  constructor() {
    effect(() => {
      const theme = this.sessionStore.themeSelected();
      if (theme === THEME.DARK) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }
}
