import { ApiService } from '../pages/settings/services/api.service';

export const initCleanUp = async (api: ApiService) => {
  const doCleanUp = () => api.cleanUpDb();

  await api.init();
  await doCleanUp();

  setInterval(() => {
    doCleanUp();
  }, 7 * 24 * 60 * 60 * 1000); // 1 week in ms
};
