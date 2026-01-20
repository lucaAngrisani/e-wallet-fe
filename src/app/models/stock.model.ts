import { MapClass, MapInterface, ObjectField } from 'mapper-factory';
import { Currency } from './currency.model';

@MapClass()
export class Stock {
  name!: string;
  ticker!: string;

  pmc!: number;
  numStocks!: number;
  lastValue!: number;

  @ObjectField(Currency)
  currency!: Currency;
}

export interface Stock extends MapInterface<Stock> {}
