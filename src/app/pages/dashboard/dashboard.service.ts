import {
  computed,
  inject,
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TableColumn } from '../../templates/table/table-column.type';
import { Transaction } from '../../models/transaction.model';
import { CurrencySymbolsService } from '../../services/currency-symbols.service';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { BarOpts, DonutOpts } from '../../shared/chart.type';

@Injectable()
export class DashboardService {
  private translate = inject(TranslateService);
  private currencySymbolsService = inject(CurrencySymbolsService);

  incomeColumns: Signal<TableColumn[]> = signal([
    {
      label: this.translate.instant('dashboard.income.category'),
      propName: 'category',
    },
    {
      label: this.translate.instant('dashboard.income.amount'),
      propName: 'amount',
    },
  ]);

  outcomeColumns: Signal<TableColumn[]> = signal([
    {
      label: this.translate.instant('dashboard.outcome.category'),
      propName: 'category',
    },
    {
      label: this.translate.instant('dashboard.outcome.amount'),
      propName: 'amount',
    },
  ]);

  public transactions: WritableSignal<Transaction[]> = signal<Transaction[]>(
    []
  );

  public totalBalanceIn = computed(() =>
    this.transactions()
      .filter((t) => t.type?.name == TRANSACTION_TYPE.IN)
      .reduce((sum, acc) => {
        return (
          sum +
          acc.amount *
            (this.currencySymbolsService.currenciesPrices()[
              acc.currency.code
            ] || 1)
        );
      }, 0)
  );

  public totalBalanceOut = computed(() =>
    this.transactions()
      .filter((t) => t.type?.name == TRANSACTION_TYPE.OUT)
      .reduce((sum, acc) => {
        return (
          sum +
          acc.amount *
            (this.currencySymbolsService.currenciesPrices()[
              acc.currency.code
            ] || 1)
        );
      }, 0)
  );

  incomeValues: Signal<
    {
      category: string;
      amount: number;
      currency: string;
      percentage: number;
    }[]
  > = computed(() => {
    const transactions = this.transactions().filter(
      (t) => t.type?.name == TRANSACTION_TYPE.IN
    );
    const grouped = transactions.reduce((acc, t) => {
      const key = t.category?.name || 'Unknown';
      if (!acc[key]) {
        acc[key] = {
          category: key,
          amount: 0,
          currency: t.currency.code,
        };
      }
      acc[key].amount += t.amount;
      return acc;
    }, {} as Record<string, { category: string; amount: number; currency: string }>);

    const total = this.totalBalanceIn();

    return Object.values(grouped)
      .map((group) => ({
        ...group,
        amount: parseFloat(group.amount.toFixed(2)),
        percentage: total ? group.amount / total : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  });

  outcomeValues: Signal<
    {
      category: string;
      amount: number;
      currency: string;
      percentage: number;
    }[]
  > = computed(() => {
    const transactions = this.transactions().filter(
      (t) => t.type?.name == TRANSACTION_TYPE.OUT
    );
    const grouped = transactions.reduce((acc, t) => {
      const key = t.category?.name || 'Unknown';
      if (!acc[key]) {
        acc[key] = {
          category: key,
          amount: 0,
          currency: t.currency.code,
        };
      }
      acc[key].amount += t.amount;
      return acc;
    }, {} as Record<string, { category: string; amount: number; currency: string }>);

    const total = this.totalBalanceOut();

    return Object.values(grouped)
      .map((group) => ({
        ...group,
        amount: parseFloat(group.amount.toFixed(2)),
        percentage: total ? group.amount / total : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  });

  incomeBar: Signal<BarOpts> = computed(() => ({
    series: [
      {
        name: this.translate.instant('dashboard.income.bar'),
        data: this.incomeValues().map((v) => v.amount),
      },
    ],
    chart: {
      type: 'bar',
      height: 320,
      width: 400,
      toolbar: { show: false },
    },
    xaxis: { categories: this.incomeValues().map((v) => v.category) },
    dataLabels: { enabled: false },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 6 } },
  }));

  incomeDonut: Signal<DonutOpts> = computed(() => ({
    series: this.incomeValues().map((v) => v.amount),
    chart: { type: 'donut', height: 320, width: 400 },
    labels: this.incomeValues().map((v) => v.category),
    responsive: [
      { breakpoint: 480, options: { legend: { position: 'bottom' } } },
    ],
    legend: { position: 'right', offsetY: 0, height: 230 },
  }));

  outcomeBar: Signal<BarOpts> = computed(() => ({
    series: [
      {
        name: this.translate.instant('dashboard.outcome.bar'),
        data: this.outcomeValues().map((v) => v.amount),
      },
    ],
    chart: {
      type: 'bar',
      height: 320,
      width: 400,
      toolbar: { show: false },
    },
    xaxis: { categories: this.outcomeValues().map((v) => v.category) },
    dataLabels: { enabled: false },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 6 } },
  }));

  outcomeDonut: Signal<DonutOpts> = computed(() => ({
    series: this.outcomeValues().map((v) => v.amount),
    chart: { type: 'donut', height: 320, width: 400 },
    labels: this.outcomeValues().map((v) => v.category),
    responsive: [
      { breakpoint: 480, options: { legend: { position: 'bottom' } } },
    ],
    legend: { position: 'right', offsetY: 0, height: 230 },
  }));
}
