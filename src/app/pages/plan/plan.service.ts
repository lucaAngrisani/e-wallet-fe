import { inject, Injectable, signal, Signal } from '@angular/core';
import { TableColumn } from '../../templates/table/table-column.type';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { liveQuery } from 'dexie';
import { db } from '../../../db';
import { Plan } from '../../models/plan.model';
import { ToastService } from '../../services/toast.service';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private translate = inject(TranslateService);
  private toastSvc = inject(ToastService);

  allPlanLists: Signal<Plan[]> = toSignal(
    from(
      liveQuery(() =>
        db.plans
          .orderBy('amount')
          .reverse()
          .filter((a) => a.logicalDelete != 1)
          .toArray()
          ?.then((list) => {
            return list.map((item) => new Plan().from(item));
          })
      )
    ),
    { initialValue: [] as Plan[] }
  );

  columns: Signal<TableColumn[]> = signal([
    { label: this.translate.instant('plan-list.name'), propName: 'name' },
    {
      label: this.translate.instant('plan-list.amount'),
      propName: 'amount',
    },
    {
      label: this.translate.instant('plan-list.type'),
      propName: 'type',
    },
    {
      label: '',
      propName: 'actions',
    },
  ]);

  async deletePlan(id: string) {
    await db.plans.update(id, { logicalDelete: 1 }).then(() => {
      this.toastSvc.success(this.translate.instant('toast.plan-deleted'));
    });
  }

  async getById(id: string): Promise<Plan | undefined> {
    const row = await db.plans.get(id);
    return row ? new Plan().from(row) : undefined;
  }
}
