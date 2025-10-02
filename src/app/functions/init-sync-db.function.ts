import { ApiService } from '../pages/settings/services/api.service';

export const initSyncDB = async (api: ApiService) => {
  const doSync = () => api.syncDb();

  await api.init();
  await doSync();

  setInterval(() => {
    doSync();
  }, 60000);
};
