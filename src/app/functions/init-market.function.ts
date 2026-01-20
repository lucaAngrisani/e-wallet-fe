import { MarketService } from '../services/market.service';

export const initMarket = async (api: MarketService) => {
  const doUpdateValues = () => api.updateValues();

  await doUpdateValues();

  setInterval(() => {
    doUpdateValues();
  }, 2 * 60 * 1000); // 2 minutes in ms
};
