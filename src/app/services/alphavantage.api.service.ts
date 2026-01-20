import { Injectable, computed, effect, signal } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import {
  Observable,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
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

type CacheEntry<T> = { ts: number; value$: Observable<T> };

@Injectable({ providedIn: 'root' })
export class AlphaVantageService {
  private readonly apiKey = 'K7AC5UKFZIBZE0JX';

  // ---- Signals di stato "globali" (puoi anche farli per-endpoint se vuoi)
  private readonly _loading = signal(false);
  private readonly _error = signal<AvError | null>(null);

  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  // ---- Cache in-memory con TTL (fondamentale per AV free)
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTtlMs = 60_000; // 1 min (orientativo)

  constructor(private http: HttpClient) {}

  // =========================
  // Endpoint 1: GLOBAL_QUOTE
  // =========================
  getQuote(symbol: string, ttlMs = this.defaultTtlMs): Observable<AvQuote> {
    const key = `quote:${symbol}`;
    return this.cached(key, ttlMs, () =>
      this.request<any>({
        function: 'GLOBAL_QUOTE',
        symbol,
      }).pipe(map(parseGlobalQuote)),
    );
  }

  // ==========================================
  // Endpoint 2: TIME_SERIES_INTRADAY (close)
  // ==========================================
  getIntraday(
    symbol: string,
    interval: IntradayInterval = '5min',
    outputsize: 'compact' | 'full' = 'compact',
    ttlMs = this.defaultTtlMs,
  ): Observable<AvTimeSeries> {
    const key = `intraday:${symbol}:${interval}:${outputsize}`;
    return this.cached(key, ttlMs, () =>
      this.request<any>({
        function: 'TIME_SERIES_INTRADAY',
        symbol,
        interval,
        outputsize,
      }).pipe(map((raw) => parseIntraday(raw, symbol, interval))),
    );
  }

  // ==================================
  // Endpoint 3: TIME_SERIES_DAILY
  // ==================================
  getDaily(
    symbol: string,
    outputsize: 'compact' | 'full' = 'compact',
    ttlMs = 5 * this.defaultTtlMs,
  ): Observable<AvTimeSeries> {
    const key = `daily:${symbol}:${outputsize}`;
    return this.cached(key, ttlMs, () =>
      this.request<any>({
        function: 'TIME_SERIES_DAILY',
        symbol,
        outputsize,
      }).pipe(map((raw) => parseDaily(raw, symbol))),
    );
  }

  // ==================================
  // Endpoint 4: SYMBOL_SEARCH
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
      this.request<any>({
        function: 'SYMBOL_SEARCH',
        keywords,
      }).pipe(map(parseSymbolSearch)),
    );
  }

  // ======================================================
  // Modalità reattiva: stream di quote da input (signals+rx)
  // ======================================================
  private readonly quoteRequests$ = new Subject<string>();

  /** Signal con l’ultimo quote ricevuto */
  readonly lastQuote = signal<AvQuote | null>(null);

  /** Attacca un "input stream" (tipo search box) per quote reattivi */
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
            this._error.set(toAvError(e));
            return of(null);
          }),
          finalize(() => this._loading.set(false)),
        );
      }),
    );
  }

  /** Da chiamare quando cambia simbolo (es. input o selection) */
  requestQuote(symbol: string) {
    this.quoteRequests$.next(symbol);
  }

  // =========================
  // Infra: request + cache
  // =========================
  private request<T extends object>(
    params: Record<string, string>,
  ): Observable<T> {
    const httpParams = new HttpParams({
      fromObject: { ...params, apikey: this.apiKey },
    });

    return this.http.get<T>(API.ALPHA.QUERY, { params: httpParams }).pipe(
      map((data: any) => {
        // Alpha Vantage segnala errori "logici" dentro JSON
        if (data?.Note)
          throw <AvError>{ kind: 'rate-limit', message: String(data.Note) };
        if (data?.['Error Message'])
          throw <AvError>{
            kind: 'api-error',
            message: String(data['Error Message']),
          };
        return data;
      }),
      // retry dolce in caso di errori di rete (NON sul rate limit)
      retry({
        count: 2,
        delay: (err) => {
          const av = toAvError(err);
          if (av.kind === 'rate-limit' || av.kind === 'api-error')
            return throwError(() => err);
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

    const value$ = factory().pipe(
      // shareReplay = tutti i subscriber condividono 1 request
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.cache.set(key, { ts: now, value$ });
    return value$;
  }
}

// =========================
// Parsers
// =========================

function parseGlobalQuote(raw: any): AvQuote {
  const q = raw?.['Global Quote'];
  if (!q)
    throw <AvError>{
      kind: 'api-error',
      message: 'Missing Global Quote in response',
    };

  const symbol = String(q['01. symbol'] ?? '');
  return {
    symbol,
    open: toNum(q['02. open']),
    high: toNum(q['03. high']),
    low: toNum(q['04. low']),
    price: toNum(q['05. price']),
    volume: toNum(q['06. volume']),
    latestTradingDay: String(q['07. latest trading day'] ?? ''),
    previousClose: toNum(q['08. previous close']),
    change: toNum(q['09. change']),
    changePercent: String(q['10. change percent'] ?? ''),
  };
}

function parseIntraday(
  raw: any,
  symbol: string,
  interval: string,
): AvTimeSeries {
  const key = `Time Series (${interval})`;
  const series = raw?.[key];
  if (!series)
    throw <AvError>{ kind: 'api-error', message: `Missing ${key} in response` };

  const points = Object.entries(series).map(([time, v]: any) => ({
    time,
    open: toNum(v['1. open']),
    high: toNum(v['2. high']),
    low: toNum(v['3. low']),
    close: toNum(v['4. close']),
    volume: toNum(v['5. volume']),
  })) as AvTimeSeriesPoint[];

  // latest first
  points.sort((a, b) => (a.time < b.time ? 1 : -1));
  return { symbol, interval, points };
}

function parseDaily(raw: any, symbol: string): AvTimeSeries {
  const series = raw?.['Time Series (Daily)'];
  if (!series)
    throw <AvError>{
      kind: 'api-error',
      message: 'Missing Time Series (Daily) in response',
    };

  const points = Object.entries(series).map(([time, v]: any) => ({
    time,
    open: toNum(v['1. open']),
    high: toNum(v['2. high']),
    low: toNum(v['3. low']),
    close: toNum(v['4. close']),
    volume: toNum(v['5. volume']),
  })) as AvTimeSeriesPoint[];

  points.sort((a, b) => (a.time < b.time ? 1 : -1));
  return { symbol, points };
}

function parseSymbolSearch(raw: any) {
  const matches = raw?.bestMatches;
  if (!Array.isArray(matches)) return [];
  return matches.map((m: any) => ({
    symbol: String(m['1. symbol'] ?? ''),
    name: String(m['2. name'] ?? ''),
    region: String(m['4. region'] ?? ''),
    currency: String(m['8. currency'] ?? ''),
    matchScore: toNum(m['9. matchScore']),
  }));
}

function toNum(v: any): number {
  const n = Number(String(v ?? '').replace('%', ''));
  return Number.isFinite(n) ? n : 0;
}

function toAvError(e: any): AvError {
  // Errori lanciati da noi (già AvError)
  if (e?.kind && e?.message) return e as AvError;

  if (e instanceof HttpErrorResponse) {
    return {
      kind: 'network',
      message: `${e.status} ${e.statusText}`.trim() || 'Network error',
    };
  }
  const msg = String(e?.message ?? e ?? 'Unknown error');

  // Heuristica rate limit di AV
  if (
    msg.toLowerCase().includes('thank you for using alpha vantage') ||
    msg.toLowerCase().includes('frequency')
  ) {
    return { kind: 'rate-limit', message: msg };
  }
  return { kind: 'api-error', message: msg };
}
