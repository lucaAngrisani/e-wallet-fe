import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AccountService } from '../account.service';
import { TransactionService } from '../../transaction/transaction.service';
import { CurrencyPipe, DatePipe, NgClass, NgStyle, PercentPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TableComponent } from '../../../templates/table/table.component';
import { TableColumn } from '../../../templates/table/table-column.type';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ColumnComponent } from '../../../templates/table/column/column.component';
import { BodyTemplateDirective } from '../../../templates/table/directives/body-template.directive';
import { TRANSACTION_TYPE } from '../../../enums/transaction-type.enum';
import { ROUTE } from '../../../router/routes/route';
import { ConfirmService } from '../../../components/confirm-dialog/confirm.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CardComponent } from '../../../templates/card/card.component';
import { AreaOpts } from '../../../shared/chart.type';
import { eachDayISO, isoDay } from '../../../functions/area-chart.function';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { Stock } from '../../../models/stock.model';
import { Currency } from '../../../models/currency.model';
import { MarketService } from '../../../services/market.service';


@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  imports: [
    CurrencyPipe,
    PercentPipe,
    NgClass,
    DatePipe,
    NgStyle,
    MatIconModule,
    MatButtonModule,
    TableComponent,
    TranslateModule,
    ColumnComponent,
    BodyTemplateDirective,
    NgApexchartsModule,
    CardComponent,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatExpansionModule,
  ],
  providers: [ConfirmService],
})
export default class AccountDetailComponent {
  public id = input<string>();

  public TRANSACTION_TYPE_IN = TRANSACTION_TYPE.IN;
  public TRANSACTION_TYPE_OUT = TRANSACTION_TYPE.OUT;
  public TRANSACTION_TYPE_TRANSFER = TRANSACTION_TYPE.TRANSFER;
  public NEW_TRANSACTION_ROUTE = [
    ROUTE.AUTH.BASE_PATH,
    ROUTE.AUTH.TRANSACTION_NEW_ACCOUNT,
  ];

  public router = inject(Router);
  private fb = inject(NonNullableFormBuilder);

  dateRangeForm = this.fb.group({
    start: this.fb.control<Date>(new Date()),
    end: this.fb.control<Date>(new Date()),
  });

  stockForm = this.fb.group({
    name: ['', Validators.required],
    ticker: [''],
    pmc: [0, [Validators.required, Validators.min(0)]],
    numStocks: [0, [Validators.required, Validators.min(0)]],
    lastValue: [0, [Validators.required, Validators.min(0)]],
  });

  public stockColumns: Signal<TableColumn[]> = signal([
    { label: 'Name', propName: 'name' },
    { label: 'Ticker', propName: 'ticker' },
    { label: 'Value', propName: 'value' },
    { label: 'PMC', propName: 'pmc' },
    { label: 'Last Value', propName: 'lastValue' },
    { label: 'Stocks', propName: 'numStocks' },
    { label: '', propName: 'actions' },
  ]);

  public editingStock: WritableSignal<Stock | null> = signal(null);
  public stockPanelOpen: WritableSignal<boolean> = signal(false);
  public showAbsoluteStockVariation: WritableSignal<boolean> = signal(false);

  public stockBalanceDifference = computed(() => {
    const acc = this.account();
    if (!acc || !acc.stocks || acc.stocks.length === 0) return null;

    const totalStockValue = acc.stocks.reduce((sum, stock) => sum + (stock.lastValue * stock.numStocks), 0);
    const balance = acc.balance;

    if (balance === 0) return 0;
    return (totalStockValue - balance) / balance;
  });

  private daysBefore: WritableSignal<number> = signal<number>(30);
  private dateRange: WritableSignal<{ start: Date; end: Date }> = signal({
    start: new Date(),
    end: new Date(),
  });

  public selectedInterval: Signal<string> = computed(() => {
    const days = this.daysBefore();
    return days == 30
      ? this.translate.instant('dashboard.last-30-days')
      : days == 90
        ? this.translate.instant('dashboard.last-90-days')
        : days == 365
          ? this.translate.instant('dashboard.last-365-days')
          : '';
  });

  private translate = inject(TranslateService);
  private accountService = inject(AccountService);
  private confirmService = inject(ConfirmService);
  private transactionService = inject(TransactionService);
  private marketService = inject(MarketService);

  public account = computed(() => {
    return this.accountService
      .allAccountLists()
      .find((a) => a.id === this.id());
  });

  public currentBalance = computed(() => {
    const acc = this.account();
    if (!acc) return 0;

    if (acc.stocks && acc.stocks.length > 0) {
       return acc.stocks.reduce((sum, stock) => sum + ((stock.lastValue || 0) * (stock.numStocks || 0)), 0);
    }
    return acc.balance;
  });

  public transactions = computed(() => {
    const { start, end } = this.dateRange();

    return this.transactionService.allTransactionLists().filter((t) => {
      const matchesAccount =
        t.account?.id === this.id() || t.toAccount?.id === this.id();
      if (!matchesAccount) return false;

      const transactionDate =
        t.date instanceof Date ? t.date : new Date(t.date);
      return transactionDate >= start && transactionDate <= end;
    });
  });

  public columns: Signal<TableColumn[]> = signal([
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
      label: this.translate.instant('transaction-list.category'),
      propName: 'category',
    },
    {
      label: '',
      propName: 'actions',
    },
  ]);

  public areaChart: Signal<AreaOpts> = computed(() => {
    const transactions = this.transactions();
    const accountId = this.id();

    if (!transactions || transactions.length === 0) {
      return this.getEmptyAreaChart();
    }

    // Trova il range di date dalle transazioni
    const dates = transactions.map((t) =>
      t.date instanceof Date ? t.date : new Date(t.date),
    );
    const start = new Date(Math.min(...dates.map((d) => d.getTime())));
    const end = new Date(Math.max(...dates.map((d) => d.getTime())));

    const allDays = eachDayISO(start, end);

    // Calcola i delta giornalieri con gestione corretta dei trasferimenti
    const histDaily = new Map<string, number>();
    for (const t of transactions) {
      const d = t.date instanceof Date ? t.date : new Date(t.date);
      const k = isoDay(d);
      let amount = 0;

      if (t.type?.name === TRANSACTION_TYPE.IN) {
        amount = t.amount;
      } else if (t.type?.name === TRANSACTION_TYPE.OUT) {
        amount = -t.amount;
      } else if (t.type?.name === TRANSACTION_TYPE.TRANSFER) {
        // Se l'account corrente è il destinatario (toAccount), è un'entrata
        if (t.toAccount?.id === accountId) {
          amount = t.amount;
        }
        // Se l'account corrente è il mittente (account), è un'uscita
        else if (t.account?.id === accountId) {
          amount = -t.amount;
        }
      }

      histDaily.set(k, (histDaily.get(k) ?? 0) + amount);
    }

    // Calcola il saldo iniziale (dal primo giorno)
    const firstDayDelta = histDaily.get(allDays[0]) ?? 0;
    const currentBalance = this.account()?.balance ?? 0;

    // Calcola il saldo cumulato per ogni giorno
    const cumulative: number[] = [];
    let accCumulative = 0;
    for (const day of allDays) {
      accCumulative += histDaily.get(day) ?? 0;
      cumulative.push(accCumulative);
    }

    // Il saldo di apertura è il saldo corrente meno l'accumulato totale
    const openingBalance = currentBalance - cumulative[cumulative.length - 1];
    const dataPast: number[] = [];
    let accData = openingBalance;
    for (const day of allDays) {
      accData += histDaily.get(day) ?? 0;
      dataPast.push(parseFloat(accData.toFixed(2)));
    }

    return {
      series: [
        {
          name: this.translate.instant('dashboard.balance.history'),
          data: dataPast,
        },
      ],
      chart: { height: 350, type: 'area' },
      xaxis: {
        type: 'datetime',
        categories: allDays,
        labels: { datetimeUTC: true },
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 3,
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
        y: {
          formatter: (v: number | null) =>
            v == null ? '' : v.toLocaleString('it-IT'),
        },
      },
      colors: ['#0B5FFF'],
    };
  });

  private getEmptyAreaChart(): AreaOpts {
    return {
      series: [
        {
          name: this.translate.instant('dashboard.balance.history'),
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
      colors: ['#0B5FFF'],
    };
  }

  constructor() {
    effect(() => {
      this.NEW_TRANSACTION_ROUTE = [
        ROUTE.AUTH.BASE_PATH,
        ROUTE.AUTH.TRANSACTION_NEW_ACCOUNT,
        this.id() || '',
      ];
    });

    this.selectLastNDays(30);
  }

  onSubmit() {
    const { start, end } = this.dateRangeForm.value;
    if (!start || !end) {
      return;
    }

    this.dateRange.set({
      start: start!,
      end: end!,
    });
  }

  selectLastNDays(days: number) {
    this.daysBefore.set(days);

    const today = new Date();
    const priorDate = new Date().setDate(today.getDate() - days);
    const start = new Date(priorDate);

    this.dateRangeForm.setValue({
      start,
      end: today,
    });

    this.dateRange.set({
      start,
      end: today,
    });
  }

  public goBack() {
    this.router.navigate([ROUTE.AUTH.BASE_PATH, ROUTE.AUTH.ACCOUNT_LIST]);
  }

  public goToEdit() {
    this.router.navigate([
      ROUTE.AUTH.BASE_PATH,
      ROUTE.AUTH.ACCOUNT_EDIT,
      this.id(),
    ]);
  }

  public getTransactionColor(transaction: any): string {
    const accountId = this.id();

    if (transaction.type?.name === TRANSACTION_TYPE.IN) {
      return 'green';
    } else if (transaction.type?.name === TRANSACTION_TYPE.OUT) {
      return 'red';
    } else if (transaction.type?.name === TRANSACTION_TYPE.TRANSFER) {
      // Se l'account corrente è il destinatario (toAccount), è verde (entrata)
      if (transaction.toAccount?.id === accountId) {
        return 'green';
      }
      // Se l'account corrente è il mittente (account), è rosso (uscita)
      else if (transaction.account?.id === accountId) {
        return 'red';
      }
    }

    return '';
  }

  public goToTransactionDetail(id: string) {
    this.router.navigate([
      ROUTE.AUTH.BASE_PATH,
      ROUTE.AUTH.TRANSACTION_EDIT_ACCOUNT,
      this.id(),
      id,
    ]);
  }

  public async askToDelete(itemId: string) {
    const ok = await this.confirmService.open(
      this.translate.instant('transaction-list.confirmDelete'),
      {
        title: this.translate.instant('common.attention'),
        confirmText: this.translate.instant('common.yes'),
        cancelText: this.translate.instant('common.no'),
      },
    );

    if (!ok) return;

    this.transactionService.deleteTransaction(itemId);
  }

  async saveStock() {
    if (this.stockForm.invalid) return;
    const { name, ticker, pmc, numStocks, lastValue } =
      this.stockForm.getRawValue();
    const account = this.account();
    if (!account) return;

    let updatedLastValue = lastValue;
    let hasError = false;

    if (ticker && ticker.trim().length > 0) {
      const quote = await this.marketService.getQuote(ticker);
      if (
        quote &&
        !quote.error &&
        typeof quote.price === 'number' &&
        quote.price > 0
      ) {
        updatedLastValue = quote.price;
        hasError = false;
      } else {
        hasError = true;
      }
    }

    if (!account.stocks) {
      account.stocks = [];
    }

    const editingStock = this.editingStock();

    if (editingStock) {
      editingStock.name = name;
      editingStock.ticker = ticker;
      editingStock.pmc = pmc;
      editingStock.numStocks = numStocks;
      editingStock.lastValue = updatedLastValue;
      editingStock.error = hasError;
      // Update the item in the array (reference is already there, but we need to trigger db update)
    } else {
      const stock = new Stock();
      stock.name = name;
      stock.ticker = ticker;
      stock.pmc = pmc;
      stock.numStocks = numStocks;
      stock.lastValue = updatedLastValue;
      stock.error = hasError;
      stock.currency = account.currency;
      account.stocks.push(stock);
    }

    await this.accountService.updateAccount(account);
    this.cancelEdit();
  }

  editStock(stock: Stock) {
    this.editingStock.set(stock);
    this.stockForm.patchValue({
        name: stock.name,
        ticker: stock.ticker,
        pmc: stock.pmc,
        numStocks: stock.numStocks,
        lastValue: stock.lastValue
    });
    this.stockPanelOpen.set(true);
  }

  cancelEdit() {
      this.stockForm.reset({ name: '', ticker: '', pmc: 0, numStocks: 0, lastValue: 0 });
      this.editingStock.set(null);
      this.stockPanelOpen.set(false);
  }

  async removeStock(stock: Stock) {
    const account = this.account();
    if (!account || !account.stocks) return;

    const index = account.stocks.indexOf(stock);
    if (index > -1) {
        account.stocks.splice(index, 1);
        await this.accountService.updateAccount(account);
    }
  }
}
