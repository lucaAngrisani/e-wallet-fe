// confirm.service.ts
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from './confirm-dialog.component';

@Injectable()
export class ConfirmService {
  constructor(private dialog: MatDialog) {}

  async open(
    message: string,
    opts: Omit<ConfirmDialogData, 'message'> = {}
  ): Promise<boolean> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message, ...opts },
      disableClose: true, // evita chiusure accidentali con ESC/click fuori
      autoFocus: false, // lasciamo il focus al bottone cdkFocusInitial
      restoreFocus: true,
      role: 'alertdialog',
    });
    const result = await firstValueFrom(ref.afterClosed());
    return !!result;
  }
}
