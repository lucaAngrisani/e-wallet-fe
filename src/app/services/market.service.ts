import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { db } from '../../db';
import { Account } from '../models/account.model';
import { AccountRow } from '../../db/models';
import { API } from '../api';
import { ApiService } from '../pages/settings/services/api.service';

interface MarketQuote {
  symbol: string;
  price?: number;
  currency?: string;
  exchangeName?: string;
  asOf?: string;
  source?: string;
  error?: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class MarketService {
  apiSvc = inject(ApiService);
  http = inject(HttpClient);

  /**
   * Aggiorna lastValue di tutti i titoli presenti negli account
   * usando il batch endpoint del backend (/market/batch)
   */
  async updateValues(): Promise<void> {
    // 1️⃣ carica account dal DB
    const rawAccounts = await db.accounts.toArray();
    const accounts = rawAccounts.map((r) => new Account().from(r));

    // 2️⃣ raccogli ticker unici
    const tickers = new Set<string>();
    for (const acc of accounts) {
      for (const s of acc.stocks ?? []) {
        const t = (s.ticker ?? '').trim().toUpperCase();
        if (t) tickers.add(t);
      }
    }

    if (tickers.size === 0) return;

    const symbols = Array.from(tickers).join(',');
    const apiKey = this.apiSvc.apiKey() || '';

    if (apiKey) {
      // 3️⃣ chiamata batch al TUO backend
      let quotes: Record<string, MarketQuote>;
      try {
        quotes = await firstValueFrom(
          this.http.get<Record<string, MarketQuote>>(API.MARKET.BATCH, {
            params: new HttpParams({ fromObject: { symbols } }),
            headers: { 'X-Api-Key': apiKey },
          }),
        );
      } catch (e) {
        console.error('Market batch failed', e);
        return;
      }

      // 4️⃣ aggiorna lastValue sui titoli
      for (const acc of accounts) {
        for (const s of acc.stocks ?? []) {
          const key = (s.ticker ?? '').trim().toUpperCase();
          const q = quotes[key];

          if (q && !q.error && typeof q.price === 'number' && q.price > 0) {
            s.lastValue = q.price;

            // opzionale ma consigliato
            // s.lastValueAsOf = q.asOf;
            // s.lastValueSource = q.source;
          }
        }
      }

      // 5️⃣ salva account aggiornati
      for (const acc of accounts) {
        await db.accounts.put(acc.toMap() as AccountRow);
      }

      console.log(`Market values updated (${tickers.size} symbols)`);
    }
  }
}
