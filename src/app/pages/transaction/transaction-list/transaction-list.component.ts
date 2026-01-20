import {
  Component,
  computed,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ROUTE } from '../../../router/routes/route';
import { TransactionService } from '../../transaction/transaction.service';
import { CurrencySymbolsService } from '../../../services/currency-symbols.service';
import { TRANSACTION_TYPE } from '../../../enums/transaction-type.enum';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TableComponent } from '../../../templates/table/table.component';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ColumnComponent } from '../../../templates/table/column/column.component';
import { BodyTemplateDirective } from '../../../templates/table/directives/body-template.directive';
import { CurrencyService } from '../../settings/services/currency.service';
import { TransactionTypeService } from '../../settings/services/transaction-type.service';
import { ConfirmService } from '../../../components/confirm-dialog/confirm.service';
import CategoryAnalysisComponent from '../category-analysis/category-analysis.component';
import { CardComponent } from '../../../templates/card/card.component';
import { CategoryLabelComponent } from '../../../components/category-label/category-label.component';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  imports: [
    NgClass,
    DatePipe,
    CurrencyPipe,
    CardComponent,
    MatIconModule,
    TableComponent,
    MatButtonModule,
    TranslateModule,
    ColumnComponent,
    BodyTemplateDirective,
    CategoryAnalysisComponent,
    CategoryLabelComponent,
  ],
  providers: [ConfirmService, CurrencyService, TransactionTypeService],
})
export default class TransactionListComponent {
  NEW_TRANSACTION_ROUTE = [ROUTE.AUTH.BASE_PATH, ROUTE.AUTH.TRANSACTION_NEW];

  public TRANSACTION_TYPE_IN = TRANSACTION_TYPE.IN;
  public TRANSACTION_TYPE_OUT = TRANSACTION_TYPE.OUT;

  public transactionListService = inject(TransactionService);
  public router = inject(Router);

  private currencySymbolsService = inject(CurrencySymbolsService);
  private confirmService = inject(ConfirmService);
  private translate = inject(TranslateService);

  public filteredCategory: WritableSignal<Category | undefined> =
    signal(undefined);

  public transactions = computed(() => {
    const all = this.transactionListService.allTransactionLists();
    const cat = this.filteredCategory();

    if (!cat) return all;

    return all.filter((t) => t.category?.id === cat.id);
  });

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

  public onSelectCategory(category: Category | undefined) {
    this.filteredCategory.set(category);
  }
}
