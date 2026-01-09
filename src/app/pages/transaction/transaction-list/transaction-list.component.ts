import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { ROUTE } from '../../../router/routes/route';
import { TransactionService } from '../../transaction/transaction.service';
import { CurrencySymbolsService } from '../../../services/currency-symbols.service';
import { TRANSACTION_TYPE } from '../../../enums/transaction-type.enum';
import { CurrencyPipe, DatePipe, NgStyle } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TableComponent } from '../../../templates/table/table.component';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ColumnComponent } from '../../../templates/table/column/column.component';
import { BodyTemplateDirective } from '../../../templates/table/directives/body-template.directive';
import { CategoryService } from '../../settings/services/category.service';
import { CurrencyService } from '../../settings/services/currency.service';
import { TransactionTypeService } from '../../settings/services/transaction-type.service';
import { ConfirmService } from '../../../components/confirm-dialog/confirm.service';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CardComponent } from '../../../templates/card/card.component';
import { BarOpts } from '../../../shared/chart.type';
import { eachDayISO, isoDay } from '../../../functions/area-chart.function';

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  imports: [
    NgStyle,
    DatePipe,
    CurrencyPipe,
    MatIconModule,
    TableComponent,
    MatButtonModule,
    TranslateModule,
    ColumnComponent,
    BodyTemplateDirective,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatExpansionModule,
    MatSelectModule,
    NgApexchartsModule,
    CardComponent,
  ],
  providers: [
    ConfirmService,
    CategoryService,
    CurrencyService,
    TransactionTypeService,
  ],
})
export default class TransactionListComponent {
  NEW_TRANSACTION_ROUTE = [ROUTE.AUTH.BASE_PATH, ROUTE.AUTH.TRANSACTION_NEW];

  public TRANSACTION_TYPE_IN = TRANSACTION_TYPE.IN;
  public TRANSACTION_TYPE_OUT = TRANSACTION_TYPE.OUT;

  public transactionListService = inject(TransactionService);
  public categoryService = inject(CategoryService);
  public router = inject(Router);
  private fb = inject(NonNullableFormBuilder);

  private currencySymbolsService = inject(CurrencySymbolsService);
  private confirmService = inject(ConfirmService);
  private translate = inject(TranslateService);

  // Date range form
  dateRangeForm = this.fb.group({
    start: this.fb.control<Date>(new Date()),
    end: this.fb.control<Date>(new Date()),
  });

  // Selected category
  selectedCategoryId: WritableSignal<string | null> = signal(null);

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

  constructor() {
    this.selectLastNDays(30);
  }

  public totalBalanceIn = computed(() =>
    this.transactionListService
      .allTransactionLists()
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
    this.transactionListService
      .allTransactionLists()
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

  // Filtered transactions by category and date range
  public categoryTransactions = computed(() => {
    const categoryId = this.selectedCategoryId();
    if (!categoryId) return [];

    const { start, end } = this.dateRange();

    return this.transactionListService
      .allTransactionLists()
      .filter((t) => {
        const matchesCategory = t.category?.id === categoryId;
        if (!matchesCategory) return false;

        const transactionDate = t.date instanceof Date ? t.date : new Date(t.date);
        return transactionDate >= start && transactionDate <= end;
      });
  });

  // Bar chart for category spending
  public categoryBarChart: Signal<BarOpts> = computed(() => {
    const transactions = this.categoryTransactions();

    if (!transactions || transactions.length === 0) {
      return this.getEmptyBarChart();
    }

    // Trova il range di date dalle transazioni
    const dates = transactions.map((t) =>
      t.date instanceof Date ? t.date : new Date(t.date)
    );
    const start = new Date(Math.min(...dates.map((d) => d.getTime())));
    const end = new Date(Math.max(...dates.map((d) => d.getTime())));

    const allDays = eachDayISO(start, end);

    // Calcola i delta giornalieri (negativo per OUT, positivo per IN)
    const histDaily = new Map<string, number>();
    for (const t of transactions) {
      const d = t.date instanceof Date ? t.date : new Date(t.date);
      const k = isoDay(d);
      let amount = 0;

      if (t.type?.name === TRANSACTION_TYPE.IN) {
        amount = t.amount;
      } else if (t.type?.name === TRANSACTION_TYPE.OUT) {
        amount = -t.amount;
      }

      histDaily.set(k, (histDaily.get(k) ?? 0) + amount);
    }

    // Crea i dati per il bar chart (non cumulativi)
    const dataPast: number[] = [];
    for (const day of allDays) {
      const value = histDaily.get(day) ?? 0;
      dataPast.push(parseFloat(value.toFixed(2)));
    }

    return {
      series: [
        {
          name: this.translate.instant('transaction-list.daily-amount'),
          data: dataPast,
        },
      ],
      chart: { height: 350, type: 'bar', toolbar: { show: false } },
      xaxis: {
        type: 'datetime',
        categories: allDays,
        labels: { datetimeUTC: true },
      },
      dataLabels: { enabled: false },
      plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
    };
  });

  private getEmptyBarChart(): BarOpts {
    return {
      series: [
        {
          name: this.translate.instant('transaction-list.daily-amount'),
          data: [],
        },
      ],
      chart: { height: 350, type: 'bar', toolbar: { show: false } },
      xaxis: { type: 'datetime', categories: [] },
      dataLabels: { enabled: false },
      plotOptions: { bar: { columnWidth: '60%', borderRadius: 4 } },
    };
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

  public goToDetail(id: string) {
    this.router.navigate([
      ROUTE.AUTH.BASE_PATH,
      ROUTE.AUTH.TRANSACTION_EDIT,
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
      }
    );

    if (!ok) return;

    this.transactionListService.deleteTransaction(itemId);
  }
}
