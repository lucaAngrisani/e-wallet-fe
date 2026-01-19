import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, RouterLink, TranslateModule],
  template: `
    <div class="flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 dark:bg-gray-800/10 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
      <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
        <mat-icon class="scale-150 text-gray-400 dark:text-gray-500 w-auto h-auto text-4xl leading-none">
          {{ icon() }}
        </mat-icon>
      </div>

      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {{ title() | translate }}
      </h3>

      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {{ description() | translate }}
      </p>

      @if (actionLabel() && actionRoute()) {
        <a mat-stroked-button color="primary" [routerLink]="actionRoute()">
          <mat-icon>add</mat-icon>
          {{ actionLabel() | translate }}
        </a>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    mat-icon {
      height: 48px;
      width: 48px;
      font-size: 48px;
    }
  `]
})
export class EmptyStateComponent {
  icon = input<string>('inbox');
  title = input<string>('');
  description = input<string>('');
  actionLabel = input<string>('');
  actionRoute = input<any[] | string | null | undefined>(null);
}
