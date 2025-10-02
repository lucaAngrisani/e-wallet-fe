import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { TransactionService } from '../transaction/transaction.service';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe, PercentPipe } from '@angular/common';
import { TableComponent } from '../../templates/table/table.component';
import { ColumnComponent } from '../../templates/table/column/column.component';
import { BodyTemplateDirective } from '../../templates/table/directives/body-template.directive';
import { DashboardService } from './dashboard.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CardComponent } from '../../templates/card/card.component';
import { AccountService } from '../account/account.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [
    PercentPipe,
    CurrencyPipe,
    CardComponent,
    MatIconModule,
    MatInputModule,
    TableComponent,
    TranslateModule,
    MatButtonModule,
    ColumnComponent,
    NgApexchartsModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    BodyTemplateDirective,
  ],
  providers: [DashboardService],
})
export default class DashboardComponent {
  private fb = inject(NonNullableFormBuilder);
  dateRangeForm = this.fb.group({
    start: this.fb.control<Date>(new Date()),
    end: this.fb.control<Date>(new Date()),
  });

  private transactionService = inject(TransactionService);

  public dashboardService = inject(DashboardService);
  public accountService = inject(AccountService);

  constructor() {
    const today = new Date();
    const priorDate = new Date().setDate(today.getDate() - 30);
    this.dateRangeForm.setValue({
      start: new Date(priorDate),
      end: today,
    });
    this.onSubmit();
    this.dateRangeForm.valueChanges.subscribe((dateRangeValue) => {
      if (dateRangeValue.start && dateRangeValue.end) {
        this.onSubmit();
      }
    });
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
}
