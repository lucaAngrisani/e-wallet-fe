import { DateField, MapClass, MapInterface, ObjectField } from 'mapper-factory';
import { Account } from './account.model';

@MapClass()
export class Holding {
  id!: string;
  qty!: number;
  name!: string;
  symbol!: string;
  bookCost!: number;
  lastPrice?: number;

  @DateField()
  lastPriceAt?: Date;

  @ObjectField(Account)
  account!: Account;

  logicalDelete?: number;
}

export interface Holding extends MapInterface<Holding> {}
