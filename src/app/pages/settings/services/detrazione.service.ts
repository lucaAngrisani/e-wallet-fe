import {
  inject,
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Detrazione } from '../../../models/detrazione.model';
import { TableColumn } from '../../../templates/table/table-column.type';
import { TranslateService } from '@ngx-translate/core';
import { addDetrazioneSafe } from '../../../../db/logic';
import { db } from '../../../../db';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';
import { ToastService } from '../../../services/toast.service';

@Injectable()
export class DetrazioneService {
  private translate = inject(TranslateService);
  private toastSvc = inject(ToastService);

  allDetrazioni: Signal<Detrazione[]> = toSignal(
    from(
      liveQuery(() =>
        db.detrazioni
          .orderBy('name')
          .filter((tx) => tx.logicalDelete != 1)
          .toArray()
          ?.then((list) => {
            return list.map((item) => new Detrazione().from(item));
          }),
      ),
    ),
    { initialValue: [] as Detrazione[] },
  );

  columns: WritableSignal<TableColumn[]> = signal([
    { label: this.translate.instant('common.name'), propName: 'name' },
    {
      label: this.translate.instant('common.description'),
      propName: 'description',
      hideOnMobile: true,
    },
    {
      label: this.translate.instant('detrazione.percentage'),
      propName: 'amount',
      showLabelInMobile: true,
    },
    {
      label: this.translate.instant('detrazione.years'),
      propName: 'years',
      showLabelInMobile: true,
    },
  ]);

  async deleteDetrazione(id: string) {
    await db.detrazioni
      .update(id, { logicalDelete: 1, lastUpdateAt: new Date().toISOString() })
      .then(() => {
        this.toastSvc.success(
          this.translate.instant('toast.detrazione-deleted'),
        );
      });
  }

  async updateDetrazione(updated: Detrazione) {
    if (updated.id) {
      await db.detrazioni
        .update(updated.id, {
          ...updated.toMap(),
          lastUpdateAt: new Date().toISOString(),
        })
        .then(() => {
          this.toastSvc.info(
            this.translate.instant('toast.detrazione-updated'),
          );
        });
    } else {
      await addDetrazioneSafe(new Detrazione().toModel(updated)).then(() => {
        this.toastSvc.success(
          this.translate.instant('toast.detrazione-created'),
        );
      });
    }
  }
}
