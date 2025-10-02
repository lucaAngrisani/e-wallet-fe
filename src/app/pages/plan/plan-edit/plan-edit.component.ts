import {
  Component,
  computed,
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
import { Plan } from '../../../models/plan.model';
import { Router } from '@angular/router';
import { ROUTE } from '../../../router/routes/route';
import { PlanService } from '../plan.service';
import { TransactionTypeService } from '../../settings/services/transaction-type.service';
import { AccountService } from '../../account/account.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Schedule } from '../../../models/schedule.model';
import { FREQUENCY } from '../../../enums/frequency.enum';
import { CategoryService } from '../../settings/services/category.service';

@Component({
  selector: 'app-plan-edit',
  templateUrl: './plan-edit.component.html',
  imports: [
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    TranslateModule,
    ReactiveFormsModule,
    InputErrorComponent,
    MatDatepickerModule,
  ],
  providers: [
    PlanService,
    AccountService,
    CurrencyService,
    CategoryService,
    TransactionTypeService,
  ],
})
export default class PlanEditComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);

  id: Signal<string | undefined> = input<string | undefined>();

  form = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.minLength(3)]),
    amount: this.fb.control<number | null>(null, [Validators.required]),
    currency: this.fb.control<string | null>(null, [Validators.required]),
    account: this.fb.control<string | null>(null, [Validators.required]),
    type: this.fb.control<string | null>(null, [Validators.required]),
    category: this.fb.control<string | null>(null, [Validators.required]),
    byDay: this.fb.control<number | null>(null, [Validators.required]),
    byHour: this.fb.control<number | null>(null, []),
    byMinute: this.fb.control<number | null>(null, []),
    freq: this.fb.control<FREQUENCY | null>(null, [Validators.required]),
    endDate: this.fb.control<Date | null>(null),
  });

  FREQUENCY_DAILY = FREQUENCY.DAILY;
  FREQUENCY_WEEKLY = FREQUENCY.WEEKLY;
  FREQUENCY_MONTHLY = FREQUENCY.MONTHLY;
  FREQUENCY_YEARLY = FREQUENCY.YEARLY;

  currencyList: Signal<Option<string>[]> = computed(() =>
    this.currencyService
      .allCurrencies()
      .map((c) => ({ value: c.id, label: c.name }))
  );

  private transactionTypeService = inject(TransactionTypeService);
  private categoryService = inject(CategoryService);
  private accountService = inject(AccountService);

  public currencyService = inject(CurrencyService);
  public planService = inject(PlanService);

  public router = inject(Router);

  public transactionTypeList: Signal<Option<string>[]> = computed(() =>
    this.transactionTypeService
      .allTransactionTypes()
      .map((at) => ({ value: at.id, label: at.name }))
  );
  public accountList: Signal<Option<string>[]> = computed(() =>
    this.accountService
      .allAccountLists()
      .map((a) => ({ value: a.id, label: a.name }))
  );
  public categoryList: Signal<Option<string>[]> = computed(() =>
    this.categoryService
      .allCategories()
      .map((c) => ({ value: c.id, label: c.name }))
  );

  async ngOnInit() {
    const id = this.id();
    if (id) {
      const plan = await this.planService.getById(id);
      if (plan) {
        this.form.patchValue({
          ...plan,
          currency: plan.currency.id,
          account: plan.account.id,
          type: plan.type.id,
          category: plan.category.id,
          byDay: plan.schedule.byDay,
          byHour: plan.schedule.byHour ?? null,
          byMinute: plan.schedule.byMinute ?? null,
          freq: plan.schedule.freq,
          endDate: plan.endDate ? new Date(plan.endDate) : null,
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
    const plan = new Plan().from({
      ...formValue,
      currency: this.currencyService
        .allCurrencies()
        .find((c) => c.id == formValue.currency),
      schedule: new Schedule().from({
        byDay: formValue.byDay!,
        byHour: formValue.byHour ?? null,
        byMinute: formValue.byMinute ?? null,
        freq: formValue.freq!,
      }),
      account: this.accountService
        .allAccountLists()
        .find((a) => a.id == formValue.account),
      type: this.transactionTypeService
        .allTransactionTypes()
        .find((at) => at.id == formValue.type),
      category: this.categoryService
        .allCategories()
        .find((c) => c.id == formValue.category),
    });

    const id = this.id();
    if (id) {
      plan.id = id;
      await db.plans.update(id, plan.toMap());
    } else {
      await db.plans.add({
        ...plan.toMap(),
        id: crypto.randomUUID(),
      });
    }

    this.router.navigate([ROUTE.AUTH.BASE_PATH, ROUTE.AUTH.PLAN_LIST]);
  }
}
