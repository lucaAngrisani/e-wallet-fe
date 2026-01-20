import { Component, inject } from '@angular/core';
import { AccountService } from '../account.service';
import { TableComponent } from '../../../templates/table/table.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ROUTE } from '../../../router/routes/route';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyPipe, NgClass, PercentPipe } from '@angular/common';
import { ColumnComponent } from '../../../templates/table/column/column.component';
import { BodyTemplateDirective } from '../../../templates/table/directives/body-template.directive';
import { ConfirmService } from '../../../components/confirm-dialog/confirm.service';

import { Stock } from '../../../models/stock.model';
import { Account } from '../../../models/account.model';

@Component({
  selector: 'app-account-list',
  templateUrl: './account-list.component.html',
  imports: [
    CurrencyPipe,
    PercentPipe,
    NgClass,
    MatIconModule,
    TableComponent,
    MatButtonModule,
    TranslateModule,
    ColumnComponent,
    BodyTemplateDirective,
  ],
  providers: [ConfirmService],
})
export default class AccountListComponent {
  NEW_ACCOUNT_ROUTE = [ROUTE.AUTH.BASE_PATH, ROUTE.AUTH.ACCOUNT_NEW];

  public accountListService = inject(AccountService);
  public router = inject(Router);

  private confirmService = inject(ConfirmService);
  private translate = inject(TranslateService);

  public goToAccountDetail(id: string) {
    this.router.navigate([ROUTE.AUTH.BASE_PATH, ROUTE.AUTH.ACCOUNT_DETAIL, id]);
  }

  public getStockBalanceDifference(acc: Account): number | null {
    if (!acc || !acc.stocks || acc.stocks.length === 0) return null;

    const totalStockValue = acc.stocks.reduce(
      (sum: number, stock: Stock) =>
        sum + (stock.lastValue || 0) * (stock.numStocks || 0),
      0,
    );
    const balance = acc.balance;

    if (balance === 0) return 0;
    return (totalStockValue - balance) / balance;
  }

  public getDisplayBalance(acc: Account): number {
    if (!acc) return 0;
    if (acc.stocks && acc.stocks.length > 0) {
      return acc.stocks.reduce(
        (sum, stock) => sum + (stock.lastValue || 0) * (stock.numStocks || 0),
        0
      );
    }
    return acc.balance;
  }

  public async askToDeleteAccount(itemId: string) {
    const ok = await this.confirmService.open(
      this.translate.instant('account-list.confirmDelete'),
      {
        title: this.translate.instant('common.attention'),
        confirmText: this.translate.instant('common.yes'),
        cancelText: this.translate.instant('common.no'),
      },
    );

    if (!ok) return;

    this.accountListService.deleteAccount(itemId);
  }
}
