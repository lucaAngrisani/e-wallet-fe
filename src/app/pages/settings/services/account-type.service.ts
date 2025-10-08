import {
  inject,
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AccountType } from '../../../models/account-type.model';
import { TableColumn } from '../../../templates/table/table-column.type';
import { TranslateService } from '@ngx-translate/core';
import { addAccountTypeSafe } from '../../../../db/logic';
import { db } from '../../../../db';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';
import { ToastService } from '../../../services/toast.service';

@Injectable()
export class AccountTypeService {
  private translate = inject(TranslateService);
  private toastSvc = inject(ToastService);

  allAccountTypes: Signal<AccountType[]> = toSignal(
    from(
      liveQuery(() =>
        db.accountTypes
          .where('logicalDelete')
          .notEqual(1)
          .toArray()
          ?.then((list) => {
            return list.map((item) => new AccountType().from(item));
          })
      )
    ),
    { initialValue: [] as AccountType[] }
  );

  columns: WritableSignal<TableColumn[]> = signal([
    { label: this.translate.instant('account-type.name'), propName: 'name' },
    {
      label: this.translate.instant('account-type.description'),
      propName: 'description',
    },
  ]);

  async deleteAccountType(id: string) {
    await db.accountTypes.update(id, { logicalDelete: 1 }).then(() => {
      this.toastSvc.success(
        this.translate.instant('toast.account-type-deleted')
      );
    });
  }

  async updateAccountType(updated: AccountType) {
    if (updated.id) {
      await db.accountTypes.update(updated.id, updated.toMap()).then(() => {
        this.toastSvc.info(
          this.translate.instant('toast.account-type-updated')
        );
      });
    } else {
      await addAccountTypeSafe(new AccountType().toModel(updated)).then(() => {
        this.toastSvc.success(
          this.translate.instant('toast.account-type-created')
        );
      });
    }
  }
}
