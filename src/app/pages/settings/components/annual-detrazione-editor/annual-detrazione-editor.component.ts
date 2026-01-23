import { Component, Inject, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import {
  AnnualDetrazione,
  AnnualDetrazioneItem,
} from '../../../../models/annual-detrazione.model';
import { DetrazioneService } from '../../services/detrazione.service';
import { Detrazione } from '../../../../models/detrazione.model';

@Component({
  selector: 'app-annual-detrazione-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
  ],
  providers: [DetrazioneService],
  templateUrl: './annual-detrazione-editor.component.html',
  styles: [
    `
      .detrazione-item {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 10px;
        padding: 10px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
      }
    `,
  ],
})
export class AnnualDetrazioneEditorComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AnnualDetrazioneEditorComponent>);
  public detrazioneService = inject(DetrazioneService);

  availableDetrazioni = this.detrazioneService.allDetrazioni;

  form = this.fb.group({
    id: [''],
    year: [
      new Date().getFullYear(),
      [Validators.required, Validators.min(1900), Validators.max(2100)],
    ],
    massimoDetraibile: [0, [Validators.required, Validators.min(0)]],
    detrazioni: this.fb.array([]),
  });

  get detrazioniArray() {
    return this.form.get('detrazioni') as FormArray;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AnnualDetrazione | undefined,
  ) {
    if (data) {
      this.form.patchValue({
        id: data.id,
        year: data.year,
        massimoDetraibile: data.massimoDetraibile,
      });
      data.detrazioni.forEach((item) => this.addDetrazione(item));
    }
  }

  addDetrazione(item?: AnnualDetrazioneItem) {
    const group = this.fb.group({
      detrazioneId: [item?.detrazioneId || '', Validators.required],
      franchigia: [item?.franchigia || null],
      massimale: [item?.massimale || null],
    });
    this.detrazioniArray.push(group);
  }

  removeDetrazione(index: number) {
    this.detrazioniArray.removeAt(index);
  }

  getDetrazioneName(id: string): string {
    return this.availableDetrazioni().find((d) => d.id === id)?.name || id;
  }

  onSubmit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
