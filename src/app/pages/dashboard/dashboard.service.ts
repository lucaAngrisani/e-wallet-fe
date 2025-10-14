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
import { Plan } from '../../models/plan.model';
import {
  aggregateDailyNet,
  calcTransactionFromPlan,
  eachDayISO,
  fillDeltaByDayFuture,
  getDates,
} from '../../functions/area-chart.function';
import { TransactionType } from '../../models/transaction-type.model';

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

  nextPlanColumns: Signal<TableColumn[]> = signal([
    {
      label: this.translate.instant('dashboard.plans.category'),
      propName: 'category',
    },
    {
      label: this.translate.instant('dashboard.plans.name'),
      propName: 'name',
    },
    {
      label: this.translate.instant('dashboard.plans.date'),
      propName: 'date',
    },
    {
      label: this.translate.instant('dashboard.plans.amount'),
      propName: 'amount',
    },
  ]);

  public transactions: WritableSignal<Transaction[]> = signal<Transaction[]>(
    []
  );

  public plannedTransactions: WritableSignal<Plan[]> = signal<Plan[]>([]);

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

  nextPlanValues: Signal<
    {
      date: Date;
      name: string;
      amount: number;
      currency: string;
      category: string;
      type: TransactionType;
    }[]
  > = computed(() => {
    const dateEnd = new Date();
    dateEnd.setMonth(dateEnd.getMonth() + 1);
    const planned = (this.plannedTransactions?.() ?? [])
      .map((p) => calcTransactionFromPlan(p, dateEnd))
      .reduce((acc, arr) => acc.concat(arr), []);

    const nextPlanValues: {
      date: Date;
      name: string;
      amount: number;
      currency: string;
      category: string;
      type: TransactionType;
    }[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = new Date(today); d <= dateEnd; d.setDate(d.getDate() + 1)) {
      planned.forEach((planTx) => {
        // Only add transactions that are planned for this day
        const planDate = new Date(planTx.date);
        planDate.setHours(0, 0, 0, 0);
        if (planDate.getTime() === d.getTime()) {
          nextPlanValues.push({
            date: planTx.date,
            type: planTx.type!,
            amount: planTx.amount,
            name: planTx.description,
            currency: planTx.currency.code,
            category: planTx.category?.name,
          });
        }
      });
    }

    return nextPlanValues;
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
      { breakpoint: 480, options: { legend: { position: 'bottom', height: 80 } } },
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
      { breakpoint: 480, options: { legend: { position: 'bottom', height: 80 } } },
    ],
    legend: { position: 'right', offsetY: 0, height: 230 },
  }));

  areaChart: Signal<AreaOpts> = computed(() => {
    const totalBalance = this.accountService.totalBalance();
    const transactions = (this.transactions() ?? []) as Transaction[];

    const { start, end, fractionToFutureDate, fractionToPastDate } =
      getDates(transactions);
    const planned = (this.plannedTransactions?.() ?? [])
      .map((p) => calcTransactionFromPlan(p, fractionToFutureDate))
      .reduce((acc, arr) => acc.concat(arr), []);

    if (!transactions?.length) {
      return this.getEmptyAreaChart();
    }

    const allDaysPast = eachDayISO(start, end);

    // ---------- STORICO (giornaliera) ----------
    const histDaily = aggregateDailyNet(transactions);

    const cumulative: number[] = [];
    let accCumulative = 0;
    for (const day of allDaysPast) {
      accCumulative += histDaily.get(day) ?? 0;
      cumulative.push(accCumulative);
    }

    const openingBalance = totalBalance - cumulative[cumulative.length - 1];
    const dataPast: number[] = [];
    let accData = openingBalance;
    for (const day of allDaysPast) {
      accData += histDaily.get(day) ?? 0;
      dataPast.push(parseFloat(accData.toFixed(2)));
    }

    // orizzonte: dai il giorno successivo all'ultimo storico fino a + FRACTION_TO_FUTURE
    const startFuture = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
    );

    // produci delta giornaliero "spalmando" la previsione uniformemente
    const futureDays = eachDayISO(startFuture, fractionToFutureDate);

    // ---------- PREVISIONE ----------
    const plannedDaily = aggregateDailyNet(planned);
    const deltaByDayFuture: Record<string, number> = fillDeltaByDayFuture(
      futureDays,
      plannedDaily,
      transactions,
      fractionToPastDate
    );

    // saldo cumulato futuro, partendo dall’ultimo saldo reale
    const lastReal = dataPast[dataPast.length - 1] ?? 0;
    const dataFuture: number[] = [];
    let accFuture = lastReal;
    for (const day of futureDays) {
      accFuture += deltaByDayFuture[day] ?? 0;
      dataFuture.push(parseFloat(accFuture.toFixed(2)));
    }

    // ---------- OUTPUT: due serie su un’unica xaxis ----------
    const categories = [...allDaysPast, ...futureDays];

    const series = [
      {
        name: this.translate.instant('dashboard.balance.history'),
        data: [...dataPast, ...new Array(futureDays.length).fill(null)],
      },
      {
        name: this.translate.instant('dashboard.balance.forecast'),
        data: [...new Array(allDaysPast.length).fill(null), ...dataFuture],
        color: '#FF9800',
      },
    ];

    return {
      series,
      chart: { height: 350, type: 'area' },
      xaxis: {
        type: 'datetime',
        categories,
        labels: { datetimeUTC: true },
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 3,
        // tratteggia solo la serie di previsione
        dashArray: [0, 6],
      },
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
        y: { formatter: (v) => (v == null ? '' : v.toLocaleString('it-IT')) },
      },
      colors: ['#0B5FFF', '#FF9800'],
      legend: { position: 'top' },
    };
  });

  getEmptyAreaChart(): AreaOpts {
    return {
      series: [
        {
          name: this.translate.instant('dashboard.balance.history'),
          data: [],
        },
        {
          name: this.translate.instant('dashboard.balance.forecast'),
          data: [],
        },
      ],
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
      colors: ['#0B5FFF', '#FF9800'],
    };
  }
}
