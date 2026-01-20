export type AvError =
  | { kind: 'rate-limit'; message: string }
  | { kind: 'api-error'; message: string }
  | { kind: 'network'; message: string };

export type IntradayInterval = '1min' | '5min' | '15min' | '30min' | '60min';

export interface AvQuote {
  symbol: string;
  open: number;
  high: number;
  low: number;
  price: number;
  volume: number;
  latestTradingDay: string;
  previousClose: number;
  change: number;
  changePercent: string;
}

export interface AvTimeSeriesPoint {
  time: string;          // ISO-ish string from AV
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AvTimeSeries {
  symbol: string;
  interval?: string;
  points: AvTimeSeriesPoint[]; // sorted desc by time (latest first)
}
