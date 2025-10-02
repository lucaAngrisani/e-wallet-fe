import { Prefs } from './prefs.model';

export type SessionState = {
  prefs: Prefs;
  loading: boolean;
  currencies: string[];
  tablePagination: Record<
    string,
    { pageIndex: number; pageSize: number; length: number }
  >;
};
