import Dexie, { Table } from 'dexie';
import {
  AccountRow,
  AccountTypeRow,
  ApiDBRow,
  ApiKeyRow,
  CategoryRow,
  CurrencyRow,
  HoldingRow,
  PlanRow,
  ScheduleRow,
  SettingRow,
  TransactionRow,
  TransactionTypeRow,
} from './models';

export class MoneyDB extends Dexie {
  accounts!: Table<AccountRow, string>;
  accountTypes!: Table<AccountTypeRow, string>;
  currencies!: Table<CurrencyRow, string>;
  categories!: Table<CategoryRow, string>;
  transactions!: Table<TransactionRow, string>;
  transactionTypes!: Table<TransactionTypeRow, string>;
  schedules!: Table<ScheduleRow, string>;
  plans!: Table<PlanRow, string>;
  holdings!: Table<HoldingRow, string>;
  settings!: Table<SettingRow, string>;
  api!: Table<ApiDBRow, string>;
  apiKey!: Table<ApiKeyRow, string>;
  lastBackupAt!: Table<{ id: string; lastBackupAt: string }, string>;
  lastCleanUpAt!: Table<{ id: string; lastCleanUpAt: string }, string>;

  constructor() {
    super('money-db');
    this.version(1).stores({
      accounts: 'id, name, balance, currency, type, logicalDelete',
      accountTypes: 'id, name, description, logicalDelete',
      currencies: 'id, name, code, logicalDelete',
      categories: 'id, parentId, name, logicalDelete',
      transactionTypes: 'id, name, color, description, logicalDelete',
      transactions: 'id, amount, description, date, account, currency, toAccount, type, category, plan, logicalDelete',
      schedules: 'id, byDay, byHour, byMinute, freq, logicalDelete',
      plans: 'id, name, amount, type, category, currency, schedule, account, endDate, logicalDelete',
      holdings: 'id, account, qty, name, symbol, bookCost, lastPrice, lastPriceAt, logicalDelete',
      settings: 'id, value, logicalDelete',
      api: 'id, method, value, logicalDelete',
      apiKey: 'id, value, logicalDelete',
      lastBackupAt: 'id, lastBackupAt',
      lastCleanUpAt: 'id, lastCleanUpAt',
    });

    const ts = () => new Date().toISOString();
    const touch = <T extends { createdAt?: string; updatedAt?: string }>(
      o: T,
      isCreate: boolean
    ) => {
      const now = ts();
      if (isCreate && !o.createdAt) o.createdAt = now;
      o.updatedAt = now;
      return o;
    };

    [this.accounts, this.transactions, this.plans].forEach((tbl) => {
      // @ts-ignore
      tbl.hook('creating', (_, obj) => touch(obj, true));
      // @ts-ignore
      tbl.hook('updating', (mods) => ({ ...mods, updatedAt: ts() }));
    });
  }
}
export const db = new MoneyDB();
