import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  Signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AccountService } from '../account.service';
import { TransactionService } from '../../transaction/transaction.service';
import { CurrencyPipe, DatePipe, NgStyle } from '@angular/common';
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

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  imports: [
    CurrencyPipe,
    DatePipe,
    NgStyle,
    MatIconModule,
    MatButtonModule,
    TableComponent,
    TranslateModule,
    ColumnComponent,
    BodyTemplateDirective,
  ],
  providers: [ConfirmService],
})
export default class AccountDetailComponent {
  public id = input<string>();

  public TRANSACTION_TYPE_IN = TRANSACTION_TYPE.IN;
  public TRANSACTION_TYPE_OUT = TRANSACTION_TYPE.OUT;
  public NEW_TRANSACTION_ROUTE = [
    ROUTE.AUTH.BASE_PATH,
    ROUTE.AUTH.TRANSACTION_NEW_ACCOUNT,
  ];

  public router = inject(Router);

  private accountService = inject(AccountService);
  private transactionService = inject(TransactionService);
  private translate = inject(TranslateService);
  private confirmService = inject(ConfirmService);

  public account = computed(() => {
    return this.accountService
      .allAccountLists()
      .find((a) => a.id === this.id());
  });

  public transactions = computed(() => {
    return this.transactionService
      .allTransactionLists()
      .filter(
        (t) => t.account?.id === this.id() || t.toAccount?.id === this.id()
      );
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

  constructor() {
    effect(() => {
      this.NEW_TRANSACTION_ROUTE = [
        ROUTE.AUTH.BASE_PATH,
        ROUTE.AUTH.TRANSACTION_NEW_ACCOUNT,
        this.id() || '',
      ];
    });
  }

  public goBack() {
    this.router.navigate([ROUTE.AUTH.BASE_PATH, ROUTE.AUTH.ACCOUNT_LIST]);
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
      }
    );

    if (!ok) return;

    this.transactionService.deleteTransaction(itemId);
  }
}
