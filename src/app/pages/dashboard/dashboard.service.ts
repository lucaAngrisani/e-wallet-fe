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
import { AreaOpts, BarOpts, DonutOpts } from '../../shared/chart.type';
import { AccountService } from '../account/account.service';

@Injectable()
export class DashboardService {
  private translate = inject(TranslateService);
  private accountService = inject(AccountService);
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
      toolbar: { show: false },
    },
    xaxis: { categories: this.incomeValues().map((v) => v.category) },
    dataLabels: { enabled: false },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 6 } },
  }));

  incomeDonut: Signal<DonutOpts> = computed(() => ({
    series: this.incomeValues().map((v) => v.amount),
    chart: { type: 'donut', height: 320 },
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
      toolbar: { show: false },
    },
    xaxis: { categories: this.outcomeValues().map((v) => v.category) },
    dataLabels: { enabled: false },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 6 } },
  }));

  outcomeDonut: Signal<DonutOpts> = computed(() => ({
    series: this.outcomeValues().map((v) => v.amount),
    chart: { type: 'donut', height: 320 },
    labels: this.outcomeValues().map((v) => v.category),
    responsive: [
      { breakpoint: 480, options: { legend: { position: 'bottom' } } },
    ],
    legend: { position: 'right', offsetY: 0, height: 230 },
  }));

  areaChart: Signal<AreaOpts> = computed(() => {
    const totalBalance = this.accountService.totalBalance();
    const transactions = this.transactions() as Array<{
      date: string | Date;
      amount: number;
      type: { name: string };
    }>;

    if (!transactions?.length) {
      return {
        series: [{ name: 'Saldo', data: [] }],
        chart: { height: 350, type: 'area' },
        xaxis: { type: 'datetime', categories: [] },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth' },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.9,
            stops: [0, 90, 100],
          },
        },
        tooltip: { x: { format: 'dd/MM/yy' } },
        colors: ['#0B5FFF'],
      };
    }

    // ---------- helpers ----------
    const isoDay = (d: Date) =>
      new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
        .toISOString()
        .slice(0, 10);

    const sign = (t?: { name: string }) =>
      t?.name === TRANSACTION_TYPE.IN
        ? 1
        : t?.name === TRANSACTION_TYPE.OUT
        ? -1
        : 0;

    function eachDayISO(from: Date, to: Date): string[] {
      const out: string[] = [];
      const d = new Date(
        Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
      );
      const end = new Date(
        Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
      );
      while (d <= end) {
        out.push(d.toISOString().slice(0, 10));
        d.setUTCDate(d.getUTCDate() + 1);
      }
      return out;
    }
    // -----------------------------

    // date min/max del dataset (puoi sostituirle con il range scelto dall'utente)
    const dates = transactions
      .map((v) => (v.date instanceof Date ? v.date : new Date(v.date)))
      .sort((a, b) => +a - +b);

    const start = dates[0];
    const end = dates[dates.length - 1];

    // 1) delta per giorno
    const deltaByDay: Record<string, number> = {};
    for (const v of transactions) {
      const d = v.date instanceof Date ? v.date : new Date(v.date);
      const k = isoDay(d);
      deltaByDay[k] = (deltaByDay[k] ?? 0) + (v.amount || 0) * sign(v.type);
    }

    // 2) tutte le giornate del range (anche senza movimenti)
    const allDays = eachDayISO(start, end);

    // 3) saldo cumulato giorno per giorno
    const cumulative: number[] = [];
    let accCumulative = 0;
    for (const day of allDays) {
      accCumulative += deltaByDay[day] ?? 0;
      cumulative.push(accCumulative);
    }

    // 4) aggiustalo in base al saldo reale (totale conti) alla fine del periodo
    const openingBalance = totalBalance - cumulative[cumulative.length - 1];
    const data: number[] = [];
    let accData = openingBalance;
    for (const day of allDays) {
      accData += deltaByDay[day] ?? 0;
      data.push(parseFloat(accData.toFixed(2)));
    }

    return {
      series: [{ name: 'Saldo', data }],
      chart: { height: 350, type: 'area' }, // width set to 100%
      xaxis: {
        type: 'datetime',
        categories: allDays, // ISO yyyy-mm-dd
        labels: { datetimeUTC: true },
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0.25,
          opacityFrom: 0.85,
          opacityTo: 0.35,
          stops: [0, 100],
        },
      },
      tooltip: {
        x: { format: 'dd/MM/yy' },
        y: { formatter: (v) => v?.toLocaleString('it-IT') },
      },
      colors: ['#0B5FFF'],
    };
  });
}
