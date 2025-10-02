import { inject, Injectable, signal, Signal } from '@angular/core';
import { TableColumn } from '../../templates/table/table-column.type';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';
import { db } from '../../../db';
import { Account } from '../../models/account.model';

@Injectable()
export class AccountService {
  private translate = inject(TranslateService);

  allAccountLists: Signal<Account[]> = toSignal(
    from(
      liveQuery(() =>
        db.accounts
          .where('logicalDelete')
          .notEqual(1)
          .toArray()
          ?.then((list) => {
            return list.map((item) => new Account().from(item));
          })
      )
    ),
    { initialValue: [] as Account[] }
  );

  columns: Signal<TableColumn[]> = signal([
    { label: this.translate.instant('account-list.name'), propName: 'name' },
    {
      label: this.translate.instant('account-list.balance'),
      propName: 'balance',
    },
    {
      label: this.translate.instant('account-list.type'),
      propName: 'type',
    },
    {
      label: '',
      propName: 'actions',
    },
  ]);

  async deleteAccount(id: string) {
    await db.accounts.update(id, { logicalDelete: 1 });
  }

  async getById(id: string): Promise<Account | undefined> {
    const row = await db.accounts.get(id);
    return row ? new Account().from(row) : undefined;
  }
}
