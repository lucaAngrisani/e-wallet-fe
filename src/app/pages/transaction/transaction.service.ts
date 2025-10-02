import { inject, Injectable, signal, Signal } from '@angular/core';
import { TableColumn } from '../../templates/table/table-column.type';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, from } from 'rxjs';
import { liveQuery } from 'dexie';
import { db } from '../../../db';
import { Transaction } from '../../models/transaction.model';

@Injectable()
export class TransactionService {
  private translate = inject(TranslateService);

  allTransactionLists: Signal<Transaction[]> = toSignal(
    from(
      liveQuery(() =>
        db.transactions
          .orderBy('date')
          .reverse()
          .filter((tx) => tx.logicalDelete != 1)
          .toArray()
          ?.then((list) => {
            return list.map((item) => new Transaction().from(item));
          })
      )
    ),
    { initialValue: [] as Transaction[] }
  );

  columns: Signal<TableColumn[]> = signal([
    {
      label: this.translate.instant('transaction-list.date'),
      propName: 'date',
    },
    {
      label: this.translate.instant('transaction-list.description'),
      propName: 'description',
    },
    {
      label: this.translate.instant('transaction-list.amount'),
      propName: 'amount',
    },
    {
      label: this.translate.instant('transaction-list.type'),
      propName: 'type',
    },
    {
      label: '',
      propName: 'actions',
    },
  ]);

  getTransactionsInDateRange(
    start: Date | null,
    end: Date | null
  ): Promise<Transaction[]> {
    if (!start || !end) {
      return Promise.resolve([]);
    }

    return firstValueFrom(
      from(
        liveQuery(() =>
          db.transactions
            .where('date')
            .between(start.toISOString(), end.toISOString(), true, true)
            .toArray()
            ?.then((list) => {
              return list.map((item) => new Transaction().from(item));
            })
        )
      )
    );
  }

  async deleteTransaction(id: string) {
    await db.transactions.update(id, { logicalDelete: 1 });
  }

  async getById(id: string): Promise<Transaction | undefined> {
    const row = await db.transactions.get(id);
    return row ? new Transaction().from(row) : undefined;
  }
}
