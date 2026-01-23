import { DateField, MapClass, MapInterface, ObjectField } from 'mapper-factory';
import { TransactionType } from './transaction-type.model';
import { Account } from './account.model';
import { Currency } from './currency.model';
import { Category } from './category.model';
import { Plan } from './plan.model';
import { Detrazione } from './detrazione.model';

@MapClass()
export class Transaction {
  id!: string;
  amount!: number;
  description!: string;

  tags?: string[];

  @DateField()
  date!: Date;

  @ObjectField(Plan)
  plan?: Plan;

  @ObjectField(Currency)
  currency!: Currency;

  @ObjectField(Category)
  category?: Category;

  @ObjectField(Detrazione)
  detrazione?: Detrazione;

  @ObjectField(Account)
  account!: Account;

  @ObjectField(Account)
  toAccount?: Account;

  @ObjectField(TransactionType)
  type!: TransactionType;

  @DateField()
  lastUpdateAt!: Date;
  logicalDelete?: number;
}

export interface Transaction extends MapInterface<Transaction> {}
