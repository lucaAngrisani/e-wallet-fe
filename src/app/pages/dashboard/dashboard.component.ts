import {
  Component,
  computed,
  inject,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TransactionService } from '../transaction/transaction.service';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
import { TableComponent } from '../../templates/table/table.component';
import { ColumnComponent } from '../../templates/table/column/column.component';
import { BodyTemplateDirective } from '../../templates/table/directives/body-template.directive';
import { DashboardService } from './dashboard.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CardComponent } from '../../templates/card/card.component';
import { AccountService } from '../account/account.service';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [
    DatePipe,
    PercentPipe,
    CurrencyPipe,
    CardComponent,
    MatIconModule,
    MatIconModule,
    MatInputModule,
    TableComponent,
    TranslateModule,
    MatButtonModule,
    ColumnComponent,
    NgApexchartsModule,
    MatExpansionModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    BodyTemplateDirective,
  ],
  providers: [DashboardService],
})
export default class DashboardComponent {
  private translate = inject(TranslateService);
  private fb = inject(NonNullableFormBuilder);

  dateRangeForm = this.fb.group({
    start: this.fb.control<Date>(new Date()),
    end: this.fb.control<Date>(new Date()),
  });

  private transactionService = inject(TransactionService);

  public dashboardService = inject(DashboardService);
  public accountService = inject(AccountService);

  private daysBefore: WritableSignal<number> = signal<number>(30);
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

  async onSubmit() {
    const { start, end } = this.dateRangeForm.value;
    if (!start || !end) {
      return;
    }

    this.dashboardService.transactions.set(
      await this.transactionService.getTransactionsInDateRange(start!, end!)
    );
  }

  async selectLastNDays(days: number) {
    this.daysBefore.set(days);

    const today = new Date();
    const priorDate = new Date().setDate(today.getDate() - days);
    this.dateRangeForm.setValue({
      start: new Date(priorDate),
      end: today,
    });

    await this.onSubmit();
  }
}
