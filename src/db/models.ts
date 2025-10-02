export interface AccountRow {
  id: string;
  name: string;
  balance: number;
  currency: CurrencyRow;
  type: AccountTypeRow;
  logicalDelete?: number;
}

export interface AccountTypeRow {
  id: string;
  name: string;
  description: string;
  logicalDelete?: number;
}

export interface CurrencyRow {
  id: string;
  name: string;
  code: string;
  symbol: string;
  description: string;
  logicalDelete?: number;
}

export interface CategoryRow {
  id: string;
  name: string;
  parentId?: string | null;
  logicalDelete?: number;
}

export interface TransactionTypeRow {
  id: string;
  name: string;
  color: string;
  description: string;
  logicalDelete?: number;
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
}

export interface ScheduleRow {
  byDay: number;
  byHour?: number | null;
  byMinute?: number | null;
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  logicalDelete?: number;
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
  logicalDelete?: number;
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
}

export interface ApiDBRow {
  id: string;
  method: 'GET' | 'POST';
  value: string;
  logicalDelete?: number;
}

export interface ApiKeyRow {
  id: string;
  value: string;
  logicalDelete?: number;
}
