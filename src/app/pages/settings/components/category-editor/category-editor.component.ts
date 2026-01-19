import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Category } from '../../../../models/category.model';

@Component({
  selector: 'app-category-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './category-editor.component.html',
})
export class CategoryEditorComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CategoryEditorComponent>);

  availableIcons = [
    'shopping_cart',
    'restaurant',
    'directions_car',
    'motorcycle',
    'flight',
    'home',
    'pets',
    'work',
    'school',
    'fitness_center',
    'medical_services',
    'local_cafe',
    'local_bar',
    'local_grocery_store',
    'local_mall',
    'local_hospital',
    'local_pharmacy',
    'local_gas_station',
    'local_parking',
    'local_dining',
    'local_activity',
    'movie',
    'theaters',
    'star',
    'favorite',
    'payment',
    'account_balance',
    'savings',
    'trending_up',
    'trending_down',
    'build',
    'settings',
    'category',
    'label',
    'list',
    'check_circle',
    'cancel',
    'info',
    'help',
    'lock',
    'person',
    'group',
    'family_restroom',
    'child_care',
    'sports_esports',
    'smartphone',
    'computer',
    'wifi',
    'lightbulb',
    'water_drop',
  ];

  form = this.fb.group({
    id: [''],
    name: ['', Validators.required],
    icon: ['category'],
    color: ['#000000'],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: Category | undefined) {
    if (data) {
      this.form.patchValue({
        id: data.id,
        name: data.name,
        icon: data.icon || 'category',
        color: data.color || '#000000',
      });
    }
  }

  selectIcon(icon: string) {
    this.form.patchValue({ icon });
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
