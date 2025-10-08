import { inject, Injectable, signal, Signal } from '@angular/core';
import { TableColumn } from '../../templates/table/table-column.type';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, from } from 'rxjs';
import { liveQuery } from 'dexie';
import { db } from '../../../db';
import { Transaction } from '../../models/transaction.model';
import { PlanService } from '../plan/plan.service';
import { Plan } from '../../models/plan.model';
import { FREQUENCY } from '../../enums/frequency.enum';
import { addTransactionSafe } from '../../../db/logic';
import { ToastService } from '../../services/toast.service';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private translate = inject(TranslateService);
  private planService = inject(PlanService);
  private toastSvc = inject(ToastService);

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
            .filter((tx) => tx.logicalDelete != 1)
            .toArray()
            ?.then((list) => {
              return list.map((item) => new Transaction().from(item));
            })
        )
      )
    );
  }

  async deleteTransaction(id: string) {
    await db.transactions.update(id, { logicalDelete: 1 }).then(() => {
      this.toastSvc.success(this.translate.instant('toast.transaction-deleted'));
    });
  }

  async getById(id: string): Promise<Transaction | undefined> {
    const row = await db.transactions.get(id);
    return row ? new Transaction().from(row) : undefined;
  }

  async evaluatePlans() {
    const plans = this.planService.allPlanLists();
    let planAdded = 0;

    for (const plan of plans) {
      const minDate: Date = plan.lastUpdateDate
        ? plan.lastUpdateDate
        : new Date();

      const dateList: Date[] = this.calcDate(plan, minDate);

      for (let date of dateList) {
        this.createTransactionFromPlan(plan, date);
        planAdded++;
      }

      plan.lastUpdateDate = new Date();
      await db.plans.update(plan.id!, {
        lastUpdateDate: plan?.toMap()?.lastUpdateDate,
      });
    }

    if (planAdded) {
      this.toastSvc.success(
        this.translate.instant('toast.plan-added', { count: planAdded })
      );
    }

    console.log(`ADDED ${planAdded} PLANS`);
  }

  async createTransactionFromPlan(plan: Plan, date: Date) {
    const newTx = new Transaction().toModel({
      amount: plan.amount,
      description: plan.name,
      tags: [],
      date: date,
      plan: plan,
      currency: plan.currency,
      category: plan.category,
      account: plan.account,
      type: plan.type,
      logicalDelete: 0,
    });

    await addTransactionSafe(newTx);
  }

  calcDate(plan: Plan, minDate: Date): Date[] {
    const dateList: Date[] = [];
    let currentDate = new Date(minDate);
    const now = new Date();

    plan.schedule.byMonth && currentDate.setMonth(plan.schedule.byMonth);
    plan.schedule.byDay && currentDate.setDate(plan.schedule.byDay);
    plan.schedule.byDayWeek &&
      currentDate.setDate(
        currentDate.getDate() +
          ((7 + plan.schedule.byDayWeek - currentDate.getDay()) % 7)
      );

    currentDate.setHours(
      plan.schedule.byHour ?? 0,
      plan.schedule.byMinute ?? 0,
      0,
      0
    );

    if (currentDate < minDate) {
      switch (plan.schedule.freq) {
        case FREQUENCY.DAILY:
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case FREQUENCY.WEEKLY:
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case FREQUENCY.MONTHLY:
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case FREQUENCY.YEARLY:
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }

    while (
      currentDate <= now &&
      (!plan.endDate || currentDate <= plan.endDate)
    ) {
      dateList.push(new Date(currentDate));
      switch (plan.schedule.freq) {
        case FREQUENCY.DAILY:
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case FREQUENCY.WEEKLY:
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case FREQUENCY.MONTHLY:
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case FREQUENCY.YEARLY:
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        default:
          currentDate = new Date(now.getTime() + 1); // exit loop
          break;
      }
    }

    return dateList;
  }
}
