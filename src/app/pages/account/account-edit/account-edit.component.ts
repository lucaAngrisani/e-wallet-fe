import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  Signal,
  signal,
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
import { AccountTypeService } from '../../settings/services/account-type.service';
import { CurrencyService } from '../../settings/services/currency.service';
import { db } from '../../../../db';
import { Account } from '../../../models/account.model';
import { Router } from '@angular/router';
import { ROUTE } from '../../../router/routes/route';
import { AccountService } from '../account.service';

@Component({
  selector: 'app-account-edit',
  templateUrl: './account-edit.component.html',
  imports: [
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    TranslateModule,
    ReactiveFormsModule,
    InputErrorComponent,
  ],
  providers: [CurrencyService, AccountTypeService],
})
export default class AccountEditComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);

  id: Signal<string | undefined> = input<string | undefined>();

  form = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.minLength(3)]),
    balance: this.fb.control<number | null>(null, [Validators.required]),
    currency: this.fb.control<string | null>(null, [Validators.required]),
    type: this.fb.control<string | null>(null, [Validators.required]),
  });

  accountTypeList: Signal<Option<string>[]> = computed(() =>
    this.accountTypeService
      .allAccountTypes()
      .map((at) => ({ value: at.id, label: at.name }))
  );
  currencyList: Signal<Option<string>[]> = computed(() =>
    this.currencyService
      .allCurrencies()
      .map((c) => ({ value: c.id, label: c.name }))
  );

  public accountTypeService = inject(AccountTypeService);
  public currencyService = inject(CurrencyService);
  public accountService = inject(AccountService);

  public router = inject(Router);

  async ngOnInit() {
    const id = this.id();
    if (id) {
      const account = await this.accountService.getById(id);
      if (account) {
        this.form.patchValue({
          ...account,
          currency: account.currency.id,
          type: account.type.id,
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
    const account = new Account().from({
      ...formValue,
      currency: this.currencyService
        .allCurrencies()
        .find((c) => c.id == formValue.currency),
      type: this.accountTypeService
        .allAccountTypes()
        .find((c) => c.id == formValue.type),
      logicalDelete: 0,
    });

    const id = this.id();
    if (id) {
      account.id = id;
      await db.accounts.update(id, {
        ...account.toMap(),
        lastUpdateAt: new Date().toISOString(),
      });
    } else {
      await db.accounts.add({
        ...account.toMap(),
        lastUpdateAt: new Date().toISOString(),
        id: crypto.randomUUID(),
      });
    }

    this.router.navigate([ROUTE.AUTH.BASE_PATH, ROUTE.AUTH.ACCOUNT_LIST]);
  }
}
