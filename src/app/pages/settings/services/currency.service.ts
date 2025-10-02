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

@Injectable()
export class CurrencyService {
  private translate = inject(TranslateService);

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
    {
      label: this.translate.instant('currency.symbol'),
      propName: 'symbol',
    },
    {
      label: this.translate.instant('currency.description'),
      propName: 'description',
    },
  ]);

  async deleteCurrency(id: string) {
    await db.currencies.update(id, { logicalDelete: 1 });
  }

  async updateCurrency(updated: Currency) {
    if (updated.id) {
      await db.currencies.update(updated.id, updated.toMap());
    } else {
      await addCurrencySafe(new Currency().toModel(updated));
    }
  }
}
