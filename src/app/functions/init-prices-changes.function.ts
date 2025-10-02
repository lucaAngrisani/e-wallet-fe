import { CurrencySymbolsService } from '../services/currency-symbols.service';

export const initPricesChanges = async (css: CurrencySymbolsService) => {
  const getPrices = () =>
    css.getPrices().then((p) => {
      css.updateCurrenciesPrices(p);
    });

  await getPrices();

  setInterval(() => {
    getPrices();
  }, 60000);
};
