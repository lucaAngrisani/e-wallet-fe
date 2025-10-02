import { DateField, MapClass, MapInterface, ObjectField } from 'mapper-factory';
import { TransactionType } from './transaction-type.model';
import { Account } from './account.model';
import { Category } from './category.model';
import { Currency } from './currency.model';
import { Schedule } from './schedule.model';

@MapClass()
export class Plan {
  id!: string;
  name!: string;
  amount!: number;

  @ObjectField(TransactionType)
  type!: TransactionType;

  @ObjectField(Account)
  account!: Account;

  @ObjectField(Category)
  category!: Category;

  @ObjectField(Currency)
  currency!: Currency;

  @ObjectField(Schedule)
  schedule!: Schedule;

  @DateField()
  endDate?: Date;

  @DateField()
  lastUpdateDate?: Date;

  @DateField()
  lastUpdateAt!: Date;
  logicalDelete?: number;
}

export interface Plan extends MapInterface<Plan> {}
