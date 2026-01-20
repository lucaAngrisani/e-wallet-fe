// src/db/logic.ts
import { TRANSACTION_TYPE } from '../app/enums/transaction-type.enum';
import { AccountType } from '../app/models/account-type.model';
import { Category } from '../app/models/category.model';
import { Currency } from '../app/models/currency.model';
import { Transaction } from '../app/models/transaction.model';
import { db } from './index';
import {
  AccountRow,
  AccountTypeRow,
  CategoryRow,
  CurrencyRow,
  PlanRow,
  SettingRow,
  TransactionRow,
  TransactionTypeRow,
} from './models';

export async function addTransactionSafe(transaction: Transaction) {
  transaction.logicalDelete = 0;
  await db.transaction('rw', db.transactions, async () => {
    await db.transactions.add({
      ...transaction.toMap(),
      lastUpdateAt: new Date().toISOString(),
      id: crypto.randomUUID(),
    });
  });

  const account = transaction.account;
  const toAccount = transaction.toAccount;
  if (account) {
    const accountInDb = await db.accounts
      .where('id')
      .equals(account.id!)
      .first();
    if (accountInDb) {
      if (transaction.type?.name === TRANSACTION_TYPE.IN)
        accountInDb.balance += transaction.amount;
      else if (transaction.type?.name === TRANSACTION_TYPE.OUT)
        accountInDb.balance -= transaction.amount;
      else if (
        transaction.type?.name === TRANSACTION_TYPE.TRANSFER &&
        toAccount
      ) {
        accountInDb.balance -= transaction.amount;
        const toAccountDb = await db.accounts
          .where('id')
          .equals(toAccount.id!)
          .first();
        if (toAccountDb) {
          toAccountDb.balance += transaction.amount;
          toAccountDb.balance = parseFloat(toAccountDb.balance.toFixed(2));
          toAccountDb.lastUpdateAt = new Date().toISOString();
          await db.accounts.put(toAccountDb);
        }
      }
      accountInDb.lastUpdateAt = new Date().toISOString();
      accountInDb.balance = parseFloat(accountInDb.balance.toFixed(2));
      await db.accounts.put(accountInDb);
    }
  }
}

export async function addAccountTypeSafe(accountType: AccountType) {
  accountType.logicalDelete = 0;
  accountType.lastUpdateAt = new Date();
  await db.transaction('rw', db.accountTypes, async () => {
    const exists = await db.accountTypes
      .where('name')
      .equals(accountType.name)
      .first();
    if (exists) throw new Error('Account type già esistente');
    await db.accountTypes.add({
      ...accountType.toMap(),
      id: crypto.randomUUID(),
    });
  });
}

export async function addCurrencySafe(currency: Currency) {
  currency.logicalDelete = 0;
  currency.lastUpdateAt = new Date();
  await db.transaction('rw', db.currencies, async () => {
    const exists = await db.currencies
      .where('code')
      .equals(currency.code)
      .first();
    if (exists) throw new Error('Currency già esistente');
    await db.currencies.add({
      ...currency.toMap(),
      id: crypto.randomUUID(),
    });
  });
}

export async function addCategorySafe(category: Category) {
  category.logicalDelete = 0;
  category.lastUpdateAt = new Date();
  await db.transaction('rw', db.categories, async () => {
    const exists = await db.categories
      .where('name')
      .equals(category.name)
      .first();
    if (exists) throw new Error('Category già esistente');
    await db.categories.add({
      ...category.toMap(),
      id: crypto.randomUUID(),
    });
  });
}

export async function exportDb(): Promise<{
  transactions: TransactionRow[];
  transactionTypes: TransactionTypeRow[];
  categories: CategoryRow[];
  currencies: CurrencyRow[];
  accountTypes: AccountTypeRow[];
  accounts: AccountRow[];
  plans: PlanRow[];
  settings: SettingRow[];
}> {
  const response = await Promise.all([
    db.transactions.toArray(),
    db.transactionTypes.toArray(),
    db.categories.toArray(),
    db.currencies.toArray(),
    db.accountTypes.toArray(),
    db.accounts.toArray(),
    db.plans.toArray(),
    db.settings.toArray(),
  ]);
  return {
    transactions: response[0],
    transactionTypes: response[1],
    categories: response[2],
    currencies: response[3],
    accountTypes: response[4],
    accounts: response[5],
    plans: response[6],
    settings: response[7],
  };
}

export async function importDb(data: {
  transactions: TransactionRow[];
  transactionTypes: TransactionTypeRow[];
  categories: CategoryRow[];
  currencies: CurrencyRow[];
  accountTypes: AccountTypeRow[];
  accounts: AccountRow[];
  plans: PlanRow[];
  settings: SettingRow[];
}): Promise<any> {
  return await Promise.all([
    data.transactions
      ? db.transactions.bulkAdd(data.transactions)
      : Promise.resolve(),
    data.transactionTypes
      ? db.transactionTypes.bulkAdd(data.transactionTypes)
      : Promise.resolve(),
    data.categories
      ? db.categories.bulkAdd(data.categories)
      : Promise.resolve(),
    data.currencies
      ? db.currencies.bulkAdd(data.currencies)
      : Promise.resolve(),
    data.accountTypes
      ? db.accountTypes.bulkAdd(data.accountTypes)
      : Promise.resolve(),
    data.accounts ? db.accounts.bulkAdd(data.accounts) : Promise.resolve(),
    data.plans ? db.plans.bulkAdd(data.plans) : Promise.resolve(),
    data.settings ? db.settings.bulkAdd(data.settings) : Promise.resolve(),
  ]);
}

export async function mergeDb(
  db1: {
    transactions: TransactionRow[];
    transactionTypes: TransactionTypeRow[];
    categories: CategoryRow[];
    currencies: CurrencyRow[];
    accountTypes: AccountTypeRow[];
    accounts: AccountRow[];
    plans: PlanRow[];
    settings: SettingRow[];
  },
  db2: {
    transactions: TransactionRow[];
    transactionTypes: TransactionTypeRow[];
    categories: CategoryRow[];
    currencies: CurrencyRow[];
    accountTypes: AccountTypeRow[];
    accounts: AccountRow[];
    plans: PlanRow[];
    settings: SettingRow[];
  }
): Promise<{
  transactions: TransactionRow[];
  transactionTypes: TransactionTypeRow[];
  categories: CategoryRow[];
  currencies: CurrencyRow[];
  accountTypes: AccountTypeRow[];
  accounts: AccountRow[];
  plans: PlanRow[];
  settings: SettingRow[];
}> {
  const data = {
    transactions: uniqueById([
      ...(db1.transactions ?? []),
      ...(db2.transactions ?? []),
    ]),
    transactionTypes: uniqueById([
      ...(db1.transactionTypes ?? []),
      ...(db2.transactionTypes ?? []),
    ]),
    categories: uniqueById([
      ...(db1.categories ?? []),
      ...(db2.categories ?? []),
    ]),
    currencies: uniqueById([
      ...(db1.currencies ?? []),
      ...(db2.currencies ?? []),
    ]),
    accountTypes: uniqueById([
      ...(db1.accountTypes ?? []),
      ...(db2.accountTypes ?? []),
    ]),
    accounts: uniqueById([...(db1.accounts ?? []), ...(db2.accounts ?? [])]),
    plans: uniqueById([...(db1.plans ?? []), ...(db2.plans ?? [])]),
    settings: uniqueById([...(db1.settings ?? []), ...(db2.settings ?? [])]),
  };

  db.transactions.clear();
  db.transactionTypes.clear();
  db.categories.clear();
  db.currencies.clear();
  db.accountTypes.clear();
  db.accounts.clear();
  db.plans.clear();
  db.settings.clear();

  await Promise.all([
    data.transactions
      ? db.transactions.bulkAdd(data.transactions)
      : Promise.resolve(),
    data.transactionTypes
      ? db.transactionTypes.bulkAdd(data.transactionTypes)
      : Promise.resolve(),
    data.categories
      ? db.categories.bulkAdd(data.categories)
      : Promise.resolve(),
    data.currencies
      ? db.currencies.bulkAdd(data.currencies)
      : Promise.resolve(),
    data.accountTypes
      ? db.accountTypes.bulkAdd(data.accountTypes)
      : Promise.resolve(),
    data.accounts ? db.accounts.bulkAdd(data.accounts) : Promise.resolve(),
    data.plans ? db.plans.bulkAdd(data.plans) : Promise.resolve(),
    data.settings ? db.settings.bulkAdd(data.settings) : Promise.resolve(),
  ]);

  return data;
}

function uniqueById<T extends { id: string; lastUpdateAt?: string }>(
  arr: T[]
): T[] {
  const map = new Map<string, T>();
  for (const item of arr) {
    const prev = map.get(item.id);
    if (!prev || (item.lastUpdateAt ?? '') > (prev.lastUpdateAt ?? '')) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}
