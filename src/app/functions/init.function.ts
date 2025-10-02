import { ApiService } from '../pages/settings/services/api.service';
import { CurrencySymbolsService } from '../services/currency-symbols.service';
import { initCleanUp } from './init-clean-up.function';
import { initDb } from './init-db.function';
import { initPricesChanges } from './init-prices-changes.function';
import { initSyncDB } from './init-sync-db.function';

export const initApp = async (css: CurrencySymbolsService, api: ApiService) => {
  console.log('INIT APP');
  await initDb();
  await initPricesChanges(css);
  await initSyncDB(api);
  await initCleanUp(api);
};
