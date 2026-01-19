import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-category-label',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="flex items-center gap-2" *ngIf="category()">
      <div 
        class="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
        [style.background-color]="category()?.color || '#e5e7eb'"
        [class.text-white]="!!category()?.color"
        [class.text-gray-600]="!category()?.color">
        <mat-icon class="!w-5 !h-5 !text-[20px] leading-none flex items-center justify-center">
          {{ category()?.icon || 'category' }}
        </mat-icon>
      </div>
      <span class="truncate">{{ category()?.name }}</span>
    </div>
  `,
  styles: [`:host { display: block; max-width: 100%; }`]
})
export class CategoryLabelComponent {
  category = input<Category | { name: string; color?: string; icon?: string } | undefined | null>();
}
