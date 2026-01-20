export interface StockRow {
  name: string;
  ticker: string;
  pmc: number;
  numStocks: number;
  lastValue: number;
  currency: CurrencyRow;
}

export interface AccountRow {
  id: string;
  name: string;
  balance: number;
  currency: CurrencyRow;
  type: AccountTypeRow;
  stocks?: StockRow[];
  logicalDelete?: number;
  lastUpdateAt: string;
}

export interface AccountTypeRow {
  id: string;
  name: string;
  description: string;
  logicalDelete?: number;
  lastUpdateAt: string;
}

export interface CurrencyRow {
  id: string;
  name: string;
  code: string;
  logicalDelete?: number;
  lastUpdateAt: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  parentId?: string | null;
  icon?: string;
  color?: string;
  logicalDelete?: number;
  lastUpdateAt: string;
}

export interface TransactionTypeRow {
  id: string;
  name: string;
  color: string;
  description: string;
  logicalDelete?: number;
  lastUpdateAt: string;
}

export interface TransactionRow {
  id: string;
  amount: number;
  description: string;
  date: string;
  tags?: string[];
  account: AccountRow | null;
  currency: CurrencyRow | null;
  toAccount?: AccountRow | null;
  type?: TransactionTypeRow | null;
  category?: CategoryRow | null;
  plan?: PlanRow | null;
  logicalDelete?: number;
  lastUpdateAt: string;
}

export interface ScheduleRow {
  byMonth?: number | null;
  byDay?: number | null;
  byDayWeek?: number | null;
  byHour?: number | null;
  byMinute?: number | null;
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  logicalDelete?: number;
  lastUpdateAt: string;
}

export interface PlanRow {
  id: string;
  name: string;
  amount: number;
  type: TransactionTypeRow;
  category: CategoryRow;
  currency: CurrencyRow;
  schedule: ScheduleRow;
  account: AccountRow;
  endDate?: string | null;
  lastUpdateDate?: string | null;
  logicalDelete?: number;
  lastUpdateAt: string;
}

export interface HoldingRow {
  id: string;
  account: AccountRow;
  qty: number;
  name: string;
  symbol: string;
  bookCost: number;
  lastPrice?: number;
  lastPriceAt?: string | null;
  logicalDelete?: number;
  lastUpdateAt: string;
}

export interface ApiDBRow {
  id: string;
  method: 'GET' | 'POST';
  value: string;
  logicalDelete?: number;
  lastUpdateAt: string;
}

export interface ApiKeyRow {
  id: string;
  value: string;
  logicalDelete?: number;
  lastUpdateAt: string;
}
