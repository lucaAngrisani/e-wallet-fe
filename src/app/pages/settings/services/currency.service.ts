import {
  inject,
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Currency } from '../../../models/currency.model';
import { TableColumn } from '../../../templates/table/table-column.type';
import { TranslateService } from '@ngx-translate/core';
import { addCurrencySafe } from '../../../../db/logic';
import { db } from '../../../../db';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';
import { ToastService } from '../../../services/toast.service';

@Injectable()
export class CurrencyService {
  private translate = inject(TranslateService);
  private toastSvc = inject(ToastService);

  allCurrencies: Signal<Currency[]> = toSignal(
    from(
      liveQuery(() =>
        db.currencies
          .where('logicalDelete')
          .notEqual(1)
          .toArray()
          ?.then((list) => {
            return list.map((item) => new Currency().from(item));
          })
      )
    ),
    { initialValue: [] as Currency[] }
  );

  columns: WritableSignal<TableColumn[]> = signal([
    { label: this.translate.instant('currency.name'), propName: 'name' },
    {
      label: this.translate.instant('currency.code'),
      propName: 'code',
    },
  ]);

  async deleteCurrency(id: string) {
    await db.currencies.update(id, { logicalDelete: 1, lastUpdateAt: new Date().toISOString() }).then(() => {
      this.toastSvc.success(this.translate.instant('toast.currency-deleted'));
    });
  }

  async updateCurrency(updated: Currency) {
    if (updated.id) {
      await db.currencies.update(updated.id, updated.toMap()).then(() => {
        this.toastSvc.info(this.translate.instant('toast.currency-updated'));
      });
    } else {
      await addCurrencySafe(new Currency().toModel(updated)).then(() => {
        this.toastSvc.success(this.translate.instant('toast.currency-created'));
      });
    }
  }
}
