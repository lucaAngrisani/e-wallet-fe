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
import { MatIconModule } from '@angular/material/icon';
import { CardComponent } from '../../../templates/card/card.component';
import { InputErrorComponent } from '../../../templates/input-error/input-error.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-plan-edit',
  templateUrl: './plan-edit.component.html',
  imports: [
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    TranslateModule,
    ReactiveFormsModule,
    InputErrorComponent,
    MatDatepickerModule,
  ],
  providers: [CurrencyService, CategoryService, TransactionTypeService],
})
export default class PlanEditComponent implements OnInit {
  private translate = inject(TranslateService);
  private fb = inject(NonNullableFormBuilder);
  private toastSvc = inject(ToastService);

  id: Signal<string | undefined> = input<string | undefined>();

  form = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.minLength(3)]),
    amount: this.fb.control<number | null>(null, [Validators.required]),
    currency: this.fb.control<string | null>(null, [Validators.required]),
    account: this.fb.control<string | null>(null, [Validators.required]),
    type: this.fb.control<string | null>(null, [Validators.required]),
    category: this.fb.control<string | null>(null, [Validators.required]),
    freq: this.fb.control<FREQUENCY | null>(null, [Validators.required]),
    byMonth: this.fb.control<number | null>(null, []),
    byDayWeek: this.fb.control<number | null>(null, []),
    byDay: this.fb.control<number | null>(null, [
      Validators.min(1),
      Validators.max(31),
    ]),
    byHour: this.fb.control<number | null>(null, [
      Validators.min(0),
      Validators.max(23),
    ]),
    byMinute: this.fb.control<number | null>(null, [
      Validators.min(0),
      Validators.max(59),
    ]),
    endDate: this.fb.control<Date | null>(null),
    lastUpdateDate: this.fb.control<Date | null>(null),
  });

  FREQUENCY_DAILY = FREQUENCY.DAILY;
  FREQUENCY_WEEKLY = FREQUENCY.WEEKLY;
  FREQUENCY_MONTHLY = FREQUENCY.MONTHLY;
  FREQUENCY_YEARLY = FREQUENCY.YEARLY;

  months = [
    { value: 0, label: 'month.jan' },
    { value: 1, label: 'month.feb' },
    { value: 2, label: 'month.mar' },
    { value: 3, label: 'month.apr' },
    { value: 4, label: 'month.may' },
    { value: 5, label: 'month.jun' },
    { value: 6, label: 'month.jul' },
    { value: 7, label: 'month.aug' },
    { value: 8, label: 'month.sep' },
    { value: 9, label: 'month.oct' },
    { value: 10, label: 'month.nov' },
    { value: 11, label: 'month.dec' },
  ];

  daysWeek = [
    { value: 0, label: 'day.sun' },
    { value: 1, label: 'day.mon' },
    { value: 2, label: 'day.tue' },
    { value: 3, label: 'day.wed' },
    { value: 4, label: 'day.thu' },
    { value: 5, label: 'day.fri' },
    { value: 6, label: 'day.sat' },
  ];

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
          byDay: plan.schedule.byDay ?? null,
          byHour: plan.schedule.byHour ?? null,
          byMinute: plan.schedule.byMinute ?? null,
          byMonth: plan.schedule.byMonth ?? null,
          byDayWeek: plan.schedule.byDayWeek ?? null,
          freq: plan.schedule.freq,
          endDate: plan.endDate ? new Date(plan.endDate) : null,
          lastUpdateDate: plan.lastUpdateDate
            ? new Date(plan.lastUpdateDate)
            : null,
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
        byMonth: formValue.byMonth ?? null,
        byMinute: formValue.byMinute ?? null,
        byDayWeek: formValue.byDayWeek ?? null,
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
      logicalDelete: 0,
    });

    const id = this.id();
    if (id) {
      plan.id = id;
      await db.plans
        .update(id, {
          ...plan.toMap(),
          lastUpdateAt: new Date().toISOString(),
        })
        .then(() => {
          this.toastSvc.info(this.translate.instant('toast.plan-updated'));
        });
    } else {
      await db.plans
        .add({
          ...plan.toMap(),
          lastUpdateAt: new Date().toISOString(),
          logicalDelete: 0,
          id: crypto.randomUUID(),
        })
        .then(() => {
          this.toastSvc.info(this.translate.instant('toast.plan-created'));
        });
    }

    this.router.navigate([ROUTE.AUTH.BASE_PATH, ROUTE.AUTH.PLAN_LIST]);
  }
}
