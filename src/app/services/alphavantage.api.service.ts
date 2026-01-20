import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import {
  Observable,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  firstValueFrom,
  map,
  of,
  retry,
  shareReplay,
  switchMap,
  tap,
  throwError,
  timer,
} from 'rxjs';

import {
  AvError,
  AvQuote,
  AvTimeSeries,
  AvTimeSeriesPoint,
  IntradayInterval,
} from '../models/alphavantage/alpha.types';

import { API } from '../api';
import { db } from '../../db';
import { Account } from '../models/account.model';
import { AccountRow } from '../../db/models';

type CacheEntry<T> = { ts: number; value$: Observable<T> };

@Injectable({ providedIn: 'root' })
export class TwelveDataService {
  private readonly apiKey = '523d570828764d5fa4a5b154780375dd';

  private readonly _loading = signal(false);
  private readonly _error = signal<AvError | null>(null);

  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTtlMs = 60_000;

  constructor(private http: HttpClient) {}

  // =========================
  // Endpoint 1: /quote
  // =========================
  getQuote(symbol: string, ttlMs = this.defaultTtlMs): Observable<AvQuote> {
    const key = `quote:${symbol}`;
    return this.cached(key, ttlMs, () =>
      this.request<any>(API.TWELVE.QUOTE, { symbol }).pipe(map(parseTdQuote)),
    );
  }

  /**
   * Batch quotes: /quote?symbol=A,B,C  (ritorna un object con chiavi = symbol)
   * Utile per updateValues: una chiamata invece di N chiamate :contentReference[oaicite:2]{index=2}
   */
  getQuotes(symbols: string[], ttlMs = this.defaultTtlMs): Observable<Record<string, AvQuote>> {
    const clean = Array.from(new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean)));
    const key = `quotes:${clean.join(',')}`;

    return this.cached(key, ttlMs, () =>
      this.request<any>(API.TWELVE.QUOTE, { symbol: clean.join(',') }).pipe(
        map((raw) => {
          // Caso singolo: Twelve Data può ritornare direttamente il quote object
          if (raw?.symbol) {
            const q = parseTdQuote(raw);
            return { [q.symbol]: q };
          }

          // Caso batch: object keyed by symbol
          const out: Record<string, AvQuote> = {};
          for (const [sym, payload] of Object.entries(raw ?? {})) {
            // Ogni payload può essere {status:'ok', ...} oppure direttamente i campi
            const inner = (payload as any)?.status ? payload : payload;
            // Se è un wrapper {status:'ok', ...} teniamo l’oggetto stesso
            const normalized = (payload as any)?.status ? payload : payload;
            try {
              const q = parseTdQuote(normalized);
              out[q.symbol] = q;
            } catch {
              // ignora singoli fallimenti nel batch
            }
          }
          return out;
        }),
      ),
    );
  }

  // ==========================================
  // Endpoint 2: /time_series (intraday)
  // ==========================================
  getIntraday(
    symbol: string,
    interval: IntradayInterval = '5min',
    outputsize: 'compact' | 'full' = 'compact',
    ttlMs = this.defaultTtlMs,
  ): Observable<AvTimeSeries> {
    const tdInterval = mapIntervalToTwelve(interval);
    const size = outputsize === 'compact' ? '100' : '5000'; // Twelve usa outputsize numerico (record count) :contentReference[oaicite:3]{index=3}

    const key = `intraday:${symbol}:${tdInterval}:${size}`;
    return this.cached(key, ttlMs, () =>
      this.request<any>(API.TWELVE.TIME_SERIES, {
        symbol,
        interval: tdInterval,
        outputsize: size,
      }).pipe(map((raw) => parseTdTimeSeries(raw, symbol, tdInterval))),
    );
  }

  // ==================================
  // Endpoint 3: /time_series (daily)
  // ==================================
  getDaily(
    symbol: string,
    outputsize: 'compact' | 'full' = 'compact',
    ttlMs = 5 * this.defaultTtlMs,
  ): Observable<AvTimeSeries> {
    const size = outputsize === 'compact' ? '100' : '5000';
    const key = `daily:${symbol}:${size}`;

    return this.cached(key, ttlMs, () =>
      this.request<any>(API.TWELVE.TIME_SERIES, {
        symbol,
        interval: '1day',
        outputsize: size,
      }).pipe(map((raw) => parseTdTimeSeries(raw, symbol, '1day'))),
    );
  }

  // ==================================
  // Endpoint 4: /symbol_search
  // ==================================
  searchSymbol(
    keywords: string,
    ttlMs = 10 * this.defaultTtlMs,
  ): Observable<
    Array<{
      symbol: string;
      name: string;
      region: string;
      currency: string;
      matchScore: number;
    }>
  > {
    const key = `search:${keywords.toLowerCase()}`;
    return this.cached(key, ttlMs, () =>
      this.request<any>(API.TWELVE.SYMBOL_SEARCH, { symbol: keywords }).pipe(
        map(parseTdSymbolSearch),
      ),
    );
  }

  // ======================================================
  // Stream reattivo quote (signals + rxjs)
  // ======================================================
  private readonly quoteRequests$ = new Subject<string>();
  readonly lastQuote = signal<AvQuote | null>(null);

  connectQuoteStream() {
    return this.quoteRequests$.pipe(
      map((s) => s.trim().toUpperCase()),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((symbol) => {
        if (!symbol) return of(null);
        this._error.set(null);
        this._loading.set(true);

        return this.getQuote(symbol).pipe(
          tap((q) => this.lastQuote.set(q)),
          map(() => null),
          catchError((e) => {
            this._error.set(toTdError(e));
            return of(null);
          }),
          finalize(() => this._loading.set(false)),
        );
      }),
    );
  }

  requestQuote(symbol: string) {
    this.quoteRequests$.next(symbol);
  }

  // =========================
  // Infra: request + cache
  // =========================
  private request<T extends object>(
    url: string,
    params: Record<string, string>,
  ): Observable<T> {
    const httpParams = new HttpParams({
      fromObject: { ...params, apikey: this.apiKey },
    });

    return this.http.get<T>(url, { params: httpParams }).pipe(
      map((data: any) => {
        // Twelve Data error format: { status: "error", message: "...", code?: ... } :contentReference[oaicite:4]{index=4}
        if (data?.status === 'error') {
          const msg = String(data?.message ?? 'Unknown API error');
          const lower = msg.toLowerCase();
          if (lower.includes('credit') || lower.includes('limit') || lower.includes('too many')) {
            throw <AvError>{ kind: 'rate-limit', message: msg };
          }
          throw <AvError>{ kind: 'api-error', message: msg };
        }
        return data;
      }),
      retry({
        count: 2,
        delay: (err) => {
          const td = toTdError(err);
          if (td.kind === 'rate-limit' || td.kind === 'api-error') return throwError(() => err);
          return timer(400);
        },
      }),
      catchError((err) => throwError(() => err)),
    );
  }

  private cached<T>(
    key: string,
    ttlMs: number,
    factory: () => Observable<T>,
  ): Observable<T> {
    const now = Date.now();
    const hit = this.cache.get(key);
    if (hit && now - hit.ts < ttlMs) return hit.value$;

    const value$ = factory().pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.cache.set(key, { ts: now, value$ });
    return value$;
  }

  // =========================
  // Update DB values (batch)
  // =========================
  public async updateValues(): Promise<void> {
    const rawAccounts = await db.accounts.toArray();
    const accounts = rawAccounts.map((r) => new Account().from(r));

    const tickers = new Set<string>();
    for (const acc of accounts) {
      for (const s of acc.stocks ?? []) {
        const t = (s.ticker ?? '').trim().toUpperCase();
        if (t) tickers.add(t);
      }
    }
    if (tickers.size === 0) return;

    const symbols = Array.from(tickers);

    try {
      const quotesMap = await firstValueFrom(this.getQuotes(symbols));

      for (const ticker of symbols) {
        const q = quotesMap[ticker];
        const price = q?.price;

        const isValid = Number.isFinite(price) && price > 0;

        for (const acc of accounts) {
          for (const s of acc.stocks ?? []) {
            if ((s.ticker ?? '').trim().toUpperCase() === ticker) {
              if (isValid) {
                s.lastValue = price;
                s.error = false;
              } else {
                s.error = true;
              }
            }
          }
        }

        if (isValid) {
          console.log(`Updated ${ticker}: ${price}`);
        } else {
          console.warn(`Skipped ${ticker}: invalid/empty quote`, q);
        }
      }
    } catch (e) {
      console.error('Failed to update values (batch quote)', e);
    }

    for (const acc of accounts) {
      await db.accounts.put(acc.toMap() as AccountRow);
    }
  }
}

// =========================
// Helpers / Parsers (Twelve Data)
// =========================

function parseTdQuote(raw: any): AvQuote {
  // Alcune risposte batch possono essere wrapper { status:"ok", ... }
  const payload = raw?.status === 'ok' ? raw : raw;

  const symbol = String(payload?.symbol ?? '').trim();
  // Twelve Data quote tende ad avere "close" come last price (e/o "price") in alcuni contesti
  const price = toNum(payload?.close ?? payload?.price);

  if (!symbol || !Number.isFinite(price) || price <= 0) {
    throw <AvError>{ kind: 'api-error', message: 'Invalid quote payload (symbol/price missing)' };
  }

  return {
    symbol,
    open: toNum(payload?.open),
    high: toNum(payload?.high),
    low: toNum(payload?.low),
    price,
    volume: toNum(payload?.volume),
    latestTradingDay: String(payload?.datetime ?? payload?.date ?? ''),
    previousClose: toNum(payload?.previous_close),
    change: toNum(payload?.change),
    changePercent: String(payload?.percent_change ?? ''),
  };
}

function parseTdTimeSeries(raw: any, fallbackSymbol: string, interval: string): AvTimeSeries {
  const metaSymbol = String(raw?.meta?.symbol ?? '').trim();
  const symbol = metaSymbol || fallbackSymbol;

  const values = raw?.values;
  if (!Array.isArray(values) || values.length === 0) {
    throw <AvError>{ kind: 'api-error', message: 'Missing time series values in response' };
  }

  const points: AvTimeSeriesPoint[] = values.map((v: any) => ({
    time: String(v?.datetime ?? v?.date ?? ''),
    open: toNum(v?.open),
    high: toNum(v?.high),
    low: toNum(v?.low),
    close: toNum(v?.close),
    volume: toNum(v?.volume),
  }));

  // Twelve Data ritorna già desc, ma ordiniamo per sicurezza
  points.sort((a, b) => (a.time < b.time ? 1 : -1));
  return { symbol, interval, points };
}

function parseTdSymbolSearch(raw: any) {
  const data = raw?.data;
  if (!Array.isArray(data)) return [];

  // Twelve Data non ha matchScore: mettiamo 1 fisso o una euristica stupida
  return data.map((m: any) => ({
    symbol: String(m?.symbol ?? ''),
    name: String(m?.instrument_name ?? m?.name ?? ''),
    region: String(m?.country ?? m?.exchange ?? ''),
    currency: String(m?.currency ?? ''),
    matchScore: 1,
  }));
}

function mapIntervalToTwelve(interval: IntradayInterval): string {
  // Twelve accetta 1min/5min/15min/30min/1h ecc. :contentReference[oaicite:5]{index=5}
  if (interval === '60min') return '1h';
  return interval;
}

function toNum(v: any): number {
  const n = Number(String(v ?? '').replace('%', ''));
  return Number.isFinite(n) ? n : 0;
}

function toTdError(e: any): AvError {
  if (e?.kind && e?.message) return e as AvError;

  if (e instanceof HttpErrorResponse) {
    if (e.status === 429) return { kind: 'rate-limit', message: 'Too many requests (429)' };
    return { kind: 'network', message: `${e.status} ${e.statusText}`.trim() || 'Network error' };
  }

  const msg = String(e?.message ?? e ?? 'Unknown error');
  const lower = msg.toLowerCase();
  if (lower.includes('credit') || lower.includes('limit') || lower.includes('too many')) {
    return { kind: 'rate-limit', message: msg };
  }
  return { kind: 'api-error', message: msg };
}
