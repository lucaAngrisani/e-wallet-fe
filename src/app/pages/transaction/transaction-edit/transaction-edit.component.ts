import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  Signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { InputErrorComponent } from '../../../templates/input-error/input-error.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { Option } from '../../../shared/option.interface';
import { CurrencyService } from '../../settings/services/currency.service';
import { db } from '../../../../db';
import { Transaction } from '../../../models/transaction.model';
import { Router } from '@angular/router';
import { ROUTE } from '../../../router/routes/route';
import { TransactionService } from '../transaction.service';
import { TransactionTypeService } from '../../settings/services/transaction-type.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TRANSACTION_TYPE } from '../../../enums/transaction-type.enum';
import { AccountService } from '../../account/account.service';
import { CategoryService } from '../../settings/services/category.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-transaction-edit',
  templateUrl: './transaction-edit.component.html',
  imports: [
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    TranslateModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    InputErrorComponent,
  ],
  providers: [
    AccountService,
    CurrencyService,
    CategoryService,
    TransactionService,
    TransactionTypeService,
  ],
})
export default class TransactionEditComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);

  id: Signal<string | undefined> = input<string | undefined>();

  public router = inject(Router);

  public transactionTypeService = inject(TransactionTypeService);
  public transactionService = inject(TransactionService);
  public currencyService = inject(CurrencyService);
  public categoryService = inject(CategoryService);
  public accountService = inject(AccountService);

  form = this.fb.group({
    amount: this.fb.control<number | null>(null, [Validators.required]),
    description: this.fb.control('', [
      Validators.required,
      Validators.minLength(3),
    ]),
    currency: this.fb.control<string | null>(null, [Validators.required]),
    tags: this.fb.control<string[] | null>(null),
    date: this.fb.control<Date | null>(new Date(), [Validators.required]),
    type: this.fb.control<string | null>(null, [Validators.required]),
    account: this.fb.control<string | null>(null, [Validators.required]),
    toAccount: this.fb.control<string | null>(null),
    category: this.fb.control<string | null>(null, [Validators.required]),
    plan: this.fb.control<string | null>(null),
  });

  transactionTypeList: Signal<Option<string>[]> = computed(() =>
    this.transactionTypeService
      .allTransactionTypes()
      .map((at) => ({ value: at.id, label: at.name }))
  );
  currencyList: Signal<Option<string>[]> = computed(() =>
    this.currencyService
      .allCurrencies()
      .map((c) => ({ value: c.id, label: c.name }))
  );
  accountList: Signal<Option<string>[]> = computed(() =>
    this.accountService
      .allAccountLists()
      .map((a) => ({ value: a.id, label: a.name }))
  );
  categoryList: Signal<Option<string>[]> = computed(() =>
    this.categoryService
      .allCategories()
      .map((c) => ({ value: c.id, label: c.name }))
  );

  TRANSACTION_TYPE_TRANSFER_ID: Signal<string | undefined> = computed(
    () =>
      this.transactionTypeService
        .allTransactionTypes()
        .find((at) => at.name === TRANSACTION_TYPE.TRANSFER)?.id
  );

  constructor() {
    effect(() => {
      const currencies = this.currencyList();
      const types = this.transactionTypeService.allTransactionTypes();

      if (!this.form.get('currency')?.value) {
        this.form.get('currency')?.setValue(currencies[0]?.value || null);
      }

      if (!this.form.get('type')?.value) {
        this.form
          .get('type')
          ?.setValue(
            types.find((t) => t.name == TRANSACTION_TYPE.OUT)?.id || null
          );
      }
    });
  }

  async ngOnInit() {
    const id = this.id();
    if (id) {
      const transaction = await this.transactionService.getById(id);
      if (transaction) {
        this.form.patchValue({
          ...transaction,
          account: transaction.account?.id,
          toAccount: transaction.toAccount?.id,
          currency: transaction.currency?.id,
          category: transaction.category?.id,
          plan: transaction.plan?.id,
          type: transaction.type?.id,
        });
      }
    }
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const transaction = new Transaction().from({
      ...formValue,
      currency: this.currencyService
        .allCurrencies()
        .find((c) => c.id == formValue.currency),
      type: this.transactionTypeService
        .allTransactionTypes()
        .find((c) => c.id == formValue.type),
      account: this.accountService
        .allAccountLists()
        .find((c) => c.id == formValue.account),
      toAccount: this.accountService
        .allAccountLists()
        .find((c) => c.id == formValue.toAccount),
      category: this.categoryService
        .allCategories()
        .find((c) => c.id == formValue.category),
      plan: undefined, //TODO: EDIT HERE WHEN PLAN WILL BE READY
    });

    const id = this.id();
    if (id) {
      transaction.id = id;
      await db.transactions.update(id, transaction.toMap());
    } else {
      await db.transactions.add({
        ...transaction.toMap(),
        id: crypto.randomUUID(),
      });
    }

    this.router.navigate([ROUTE.AUTH.BASE_PATH, ROUTE.AUTH.TRANSACTION_LIST]);
  }
}
