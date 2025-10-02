import { DateField, MapClass, MapInterface, ObjectField } from 'mapper-factory';
import { AccountType } from './account-type.model';
import { Currency } from './currency.model';

@MapClass()
export class Account {
  id!: string;
  name!: string;

  balance!: number;

  @ObjectField(Currency)
  currency!: Currency;

  @ObjectField(AccountType)
  type!: AccountType;

  @DateField()
  lastUpdateAt!: Date;
  logicalDelete?: number;
}

export interface Account extends MapInterface<Account> {}
