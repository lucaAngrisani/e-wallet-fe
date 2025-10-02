import { Component, computed, inject } from '@angular/core';
import { AccountService } from '../account.service';
import { TableComponent } from '../../../templates/table/table.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ROUTE } from '../../../router/routes/route';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CurrencyPipe } from '@angular/common';
import { ColumnComponent } from '../../../templates/table/column/column.component';
import { BodyTemplateDirective } from '../../../templates/table/directives/body-template.directive';
import { CurrencySymbolsService } from '../../../services/currency-symbols.service';
import { ConfirmService } from '../../../components/confirm-dialog/confirm.service';

@Component({
  selector: 'app-account-list',
  templateUrl: './account-list.component.html',
  imports: [
    CurrencyPipe,
    MatIconModule,
    TableComponent,
    MatButtonModule,
    TranslateModule,
    ColumnComponent,
    BodyTemplateDirective,
  ],
  providers: [ConfirmService, AccountService],
})
export default class AccountListComponent {
  NEW_ACCOUNT_ROUTE = [ROUTE.AUTH.BASE_PATH, ROUTE.AUTH.ACCOUNT_NEW];

  public accountListService = inject(AccountService);
  public router = inject(Router);

  private currencySymbolsService = inject(CurrencySymbolsService);
  private confirmService = inject(ConfirmService);
  private translate = inject(TranslateService);

  public totalBalance = computed(() =>
    this.accountListService.allAccountLists().reduce((sum, acc) => {
      return (
        sum +
        acc.balance *
          (this.currencySymbolsService.currenciesPrices()[acc.currency.code] ||
            1)
      );
    }, 0)
  );

  public goToDetail(id: string) {
    this.router.navigate([ROUTE.AUTH.BASE_PATH, ROUTE.AUTH.ACCOUNT_EDIT, id]);
  }

  public async askToDeleteAccount(itemId: string) {
    const ok = await this.confirmService.open(
      this.translate.instant('account-list.confirmDelete'),
      {
        title: this.translate.instant('common.attention'),
        confirmText: this.translate.instant('common.yes'),
        cancelText: this.translate.instant('common.no'),
      }
    );

    if (!ok) return;

    this.accountListService.deleteAccount(itemId);
  }
}
