import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';

type ToastLevel = 'success' | 'error' | 'warn' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private snack = inject(MatSnackBar);
  private breakpoint = inject(BreakpointObserver);

  private baseCfg(duration = 3000): MatSnackBarConfig {
    const isMobile = this.breakpoint.isMatched('(max-width: 800px)');

    return {
      duration,
      horizontalPosition: isMobile ? 'center' : 'right', // 'end' se vuoi RTL-aware
      verticalPosition: isMobile ? 'bottom' : 'top',
      politeness: 'polite', // 'assertive' per errori gravi
    };
  }

  open(message: string, level: ToastLevel = 'info', cfg?: MatSnackBarConfig) {
    const panelClass = [`toast-${level}`];
    return this.snack.open(message, undefined, {
      ...this.baseCfg(),
      panelClass,
      ...cfg,
    });
  }

  success(msg: string, cfg?: MatSnackBarConfig) {
    return this.open(msg, 'success', cfg);
  }

  error(msg: string, cfg?: MatSnackBarConfig) {
    return this.open(msg, 'error', {
      ...cfg,
      politeness: 'assertive',
      duration: 5000,
    });
  }

  warn(msg: string, cfg?: MatSnackBarConfig) {
    return this.open(msg, 'warn', { ...cfg, duration: 4000 });
  }

  info(msg: string, cfg?: MatSnackBarConfig) {
    return this.open(msg, 'info', cfg);
  }
}
