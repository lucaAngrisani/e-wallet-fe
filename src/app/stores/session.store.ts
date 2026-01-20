import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  patchState,
} from '@ngrx/signals';
import { SessionState } from './models/session.model';
import { THEME } from '../enums/theme.enum';
import { LANG } from '../enums/lang.enum';
import { Prefs } from './models/prefs.model';
import { inject } from '@angular/core';
import { LangService } from '../services/lang.service';

const DEFAULT_STATE: SessionState = {
  prefs: { theme: THEME.LIGHT, lang: LANG.EN, taxOnCapitalGains: 26 },
  currencies: [],
  loading: false,
  tablePagination: {},
};

import { db } from '../../db';

export const SessionStore = signalStore(
  { providedIn: 'root' },
  withState<SessionState>(DEFAULT_STATE),

  withComputed((s) => ({
    isLoading: () => !!s.loading(),
    themeSelected: () => s.prefs().theme,
    langSelected: () => s.prefs().lang,
    taxOnCapitalGains: () => s.prefs().taxOnCapitalGains,
    allCurrencies: () => s.currencies(),
  })),

  withMethods((store) => {
    function addCurrency(currency: string) {
      const current = store.currencies();
      if (!current.includes(currency)) {
        const updated = [...current, currency];
        patchState(store, { currencies: updated });
        persist();
      }
    }

    function setCurrencies(currencies: string[]) {
      patchState(store, { currencies });
      persist();
    }

    function setPrefs(partial: Partial<Prefs>) {
      patchState(store, { prefs: { ...store.prefs(), ...partial } });
      persist();
    }

    function resetPrefs() {
      patchState(store, DEFAULT_STATE);
      persist();
    }

    function setTheme(theme: THEME) {
      setPrefs({ theme });
    }

    const langSvc = inject(LangService);
    function setLang(lang: LANG) {
      langSvc.use(lang);
      setPrefs({ lang });
    }

    function setLoading(loading: boolean) {
      patchState(store, { loading });
      persist();
    }

    function isLoggedIn(): boolean {
      return !!store;
    }

    // --- Persistence ---
    const KEY = 'app_session_v1';

    function persist() {
      if (typeof window === 'undefined') return;
      const { prefs } = store;
      const snapshot = {
        prefs: prefs(),
      };

      //CONSIDER TO USE OTHER PERSISTANT STORAGE
      localStorage.setItem(KEY, JSON.stringify(snapshot));
    }

    async function hydrate() {
      if (typeof window === 'undefined') return;
      
      let prefsFromDb: Partial<Prefs> = {};
      try {
        const taxRow = await db.settings
          .where('id')
          .equals('TAX_CAPITAL_GAIN')
          .first();
        if (taxRow) {
          prefsFromDb.taxOnCapitalGains = parseFloat(taxRow.value);
        }
      } catch (e) {
        console.warn('Cannot read settings from DB', e);
      }

      const raw = localStorage.getItem(KEY);
      if (!raw && Object.keys(prefsFromDb).length === 0) return;
      
      try {
        const parsed = raw ? JSON.parse(raw) as Partial<SessionState> : {};
        patchState(store, {
          prefs: { 
            ...DEFAULT_STATE.prefs, 
            ...(parsed.prefs ?? {}),
            ...prefsFromDb
           },
        });
      } catch (e) {
        console.warn('[SessionStore] hydrate parse error', e);
      }
    }

    function setTablePagination(
      tableId: string,
      pagination: { pageIndex: number; pageSize: number; length: number }
    ) {
      patchState(store, {
        tablePagination: { ...store.tablePagination(), [tableId]: pagination },
      });
      persist();
    }

    return {
      setTablePagination,
      setCurrencies,
      addCurrency,
      isLoggedIn,
      resetPrefs,
      setLoading,
      setTheme,
      setLang,
      setPrefs,
      hydrate,
    };
  })
);
