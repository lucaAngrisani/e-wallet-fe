import {
  inject,
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TransactionType } from '../../../models/transaction-type.model';
import { TableColumn } from '../../../templates/table/table-column.type';
import { TranslateService } from '@ngx-translate/core';
import { db } from '../../../../db';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';

@Injectable()
export class TransactionTypeService {
  private translate = inject(TranslateService);

  allTransactionTypes: Signal<TransactionType[]> = toSignal(
    from(
      liveQuery(() =>
        db.transactionTypes
          .where('logicalDelete')
          .notEqual(1)
          .toArray()
          ?.then((list) => {
            return list.map((item) => new TransactionType().from(item));
          })
      )
    ),
    { initialValue: [] as TransactionType[] }
  );

  columns: WritableSignal<TableColumn[]> = signal([
    {
      label: this.translate.instant('transaction-type.name'),
      propName: 'name',
    },
    {
      label: this.translate.instant('transaction-type.description'),
      propName: 'description',
    },
  ]);

  async deleteTransactionType(id: string) {
    await db.transactionTypes.update(id, { logicalDelete: 1 });
  }

  async updateTransactionType(updated: TransactionType) {
    if (updated.id) {
      await db.transactionTypes.update(updated.id, updated.toMap());
    }
  }
}
