import {
  inject,
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AnnualDetrazione } from '../../../models/annual-detrazione.model';
import { TableColumn } from '../../../templates/table/table-column.type';
import { TranslateService } from '@ngx-translate/core';
import { addAnnualDetrazioneSafe } from '../../../../db/logic';
import { db } from '../../../../db';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';
import { ToastService } from '../../../services/toast.service';

@Injectable()
export class AnnualDetrazioneService {
  private translate = inject(TranslateService);
  private toastSvc = inject(ToastService);

  allAnnualDetrazioni: Signal<AnnualDetrazione[]> = toSignal(
    from(
      liveQuery(() =>
        db.annualDetrazioni
          .orderBy('year')
          .reverse()
          .filter((tx) => tx.logicalDelete != 1)
          .toArray()
          ?.then((list) => {
            return list.map((item) => new AnnualDetrazione().from(item));
          }),
      ),
    ),
    { initialValue: [] as AnnualDetrazione[] },
  );

  columns: WritableSignal<TableColumn[]> = signal([
    { label: this.translate.instant('common.year'), propName: 'year' },
    {
      label: this.translate.instant('detrazione.massimo-detraibile'),
      propName: 'massimoDetraibile',
      showLabelInMobile: true,
    },
    { label: '', propName: 'actions' },
  ]);

  async deleteAnnualDetrazione(id: string) {
    await db.annualDetrazioni
      .update(id, { logicalDelete: 1, lastUpdateAt: new Date().toISOString() })
      .then(() => {
        this.toastSvc.success(
          this.translate.instant('toast.annual-detrazione-deleted'),
        );
      });
  }

  async updateAnnualDetrazione(updated: AnnualDetrazione) {
    if (updated.id) {
      await db.annualDetrazioni
        .update(updated.id, {
          ...updated.toMap(),
          lastUpdateAt: new Date().toISOString(),
        })
        .then(() => {
          this.toastSvc.info(
            this.translate.instant('toast.annual-detrazione-updated'),
          );
        });
    } else {
      await addAnnualDetrazioneSafe(
        new AnnualDetrazione().toModel(updated),
      ).then(() => {
        this.toastSvc.success(
          this.translate.instant('toast.annual-detrazione-created'),
        );
      });
    }
  }
}
