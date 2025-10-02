import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { SessionStore } from '../stores/session.store';
import { firstValueFrom } from 'rxjs';
import { db } from '../../db';
import { Account } from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class CurrencySymbolsService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly store = inject(SessionStore);

  public currenciesPrices = signal<Record<string, number>>(
    {} as Record<string, number>
  );

  async getPrices() {
    const currencies = await this.updateCurrenciesInSession();
    if (
      currencies.length > 1 ||
      (currencies.length === 1 && currencies[0] !== 'EUR') //TODO: CAMBIA QUESTO 'EUR' CON LA CURRENCY DI DEFAULT
    ) {
      return firstValueFrom(
        this.http.get(
          `https://api.frankfurter.dev/v1/latest?symbols=${currencies.join(
            ','
          )}`
        )
      ).then(
        (response) =>
          (
            response as {
              base: string;
              date: string;
              rates: Record<string, number>;
            }
          )['rates']
      );
    } else {
      return { EUR: 1 };
    }
  }

  async updateCurrenciesInSession() {
    const accounts: Account[] =
      (await db.accounts.toArray())?.map((a) => new Account().from(a)) || [];
    const currencies = Array.from(
      new Set(accounts.map((a) => a.currency.code))
    );
    this.store.setCurrencies(currencies);

    return currencies;
  }

  async updateCurrenciesPrices(prices: Record<string, number>) {
    this.currenciesPrices.set(prices);
  }
}
