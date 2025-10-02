import { ApiService } from '../pages/settings/services/api.service';
import { TransactionService } from '../pages/transaction/transaction.service';
import { CurrencySymbolsService } from '../services/currency-symbols.service';
import { initCleanUp } from './init-clean-up.function';
import { initDb } from './init-db.function';
import { initEvaluatePlan } from './init-evaluate-plans.function';
import { initPricesChanges } from './init-prices-changes.function';
import { initSyncDB } from './init-sync-db.function';

export const initApp = async (
  css: CurrencySymbolsService,
  api: ApiService,
  transactionService: TransactionService,
) => {
  console.log('INIT APP');
  await initDb();
  await initPricesChanges(css);
  await initSyncDB(api);
  await initEvaluatePlan(transactionService);
  await initCleanUp(api);
};
