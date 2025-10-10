import { FREQUENCY } from '../enums/frequency.enum';
import { TRANSACTION_TYPE } from '../enums/transaction-type.enum';
import { Plan } from '../models/plan.model';
import { Transaction } from '../models/transaction.model';

const WEIGHTS = { w0: 1, w1: 0.3, w2: 0.2, w3: 0.5 }; // w0: peso media ultimo periodo (FRACTION_TO_PAST) - w1: stesso periodo precedente (mese) - w2: stesso periodo precedente (anno) - w3: pianificati
const FRACTION_TO_PAST = 0.5; // estensione dell'orizzonte nel passato !! 1 è il totale di tempo delle transazioni considerate
const FRACTION_TO_FUTURE = 0.3; // estensione dell'orizzonte nel futuro !! 1 è il totale di tempo delle transazioni considerate

// helper date
export const isoDay = (d: Date) =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    .toISOString()
    .slice(0, 10);

// segno IN/OUT
export const sign = (t?: { name: string }) =>
  t?.name === TRANSACTION_TYPE.IN
    ? 1
    : t?.name === TRANSACTION_TYPE.OUT
    ? -1
    : 0;

// date helpers
export const monthKey = (y: number, m: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}`;

export const lastOfMonthUTC = (y: number, m: number) =>
  new Date(Date.UTC(y, m + 1, 0));
export const daysInMonth = (y: number, m: number) =>
  lastOfMonthUTC(y, m).getUTCDate();

export function eachDayISO(from: Date, to: Date): string[] {
  const out: string[] = [];
  const d = new Date(
    Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  );
  const end = new Date(Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()));
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export function rollMonths(y: number, m: number, offset: number) {
  const date = new Date(Date.UTC(y, m, 1));
  date.setUTCMonth(date.getUTCMonth() + offset);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

export function aggregateDailyNet(
  transactions: Transaction[]
): Map<string, number> {
  // mappa "YYYY-MM-DD" -> somma netta (IN - OUT) del giorno
  const out = new Map<string, number>();
  for (const t of transactions) {
    const d = t.date instanceof Date ? t.date : new Date(t.date);
    const k = isoDay(d);
    out.set(k, (out.get(k) ?? 0) + (t.amount || 0) * sign(t.type));
  }
  return out;
}

export function calcTransactionFromPlan(
  plan: Plan,
  maxDate: Date
): Transaction[] {
  const dateList: Date[] = [];
  let currentDate = new Date();
  const now = new Date();

  plan.schedule.byMonth && currentDate.setMonth(plan.schedule.byMonth);
  plan.schedule.byDay && currentDate.setDate(plan.schedule.byDay);
  plan.schedule.byDayWeek &&
    currentDate.setDate(
      currentDate.getDate() +
        ((7 + plan.schedule.byDayWeek - currentDate.getDay()) % 7)
    );

  currentDate.setHours(
    plan.schedule.byHour ?? 0,
    plan.schedule.byMinute ?? 0,
    0,
    0
  );

  while (
    currentDate <= maxDate &&
    (!plan.endDate || currentDate <= plan.endDate)
  ) {
    dateList.push(new Date(currentDate));
    switch (plan.schedule.freq) {
      case FREQUENCY.DAILY:
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case FREQUENCY.WEEKLY:
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case FREQUENCY.MONTHLY:
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case FREQUENCY.YEARLY:
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      default:
        currentDate = new Date(maxDate.getTime() + 1);
        break;
    }
  }

  return dateList.map((d) =>
    new Transaction().toModel({
      amount: plan.amount,
      description: plan.name,
      tags: [],
      date: d,
      plan: plan,
      currency: plan.currency,
      category: plan.category,
      account: plan.account,
      type: plan.type,
      logicalDelete: 0,
    })
  );
}

export function getDates(transactions: Transaction[]): {
  start: Date;
  end: Date;
  fractionToFutureDate: Date;
  fractionToPastDate: Date;
} {
  // ---------- STORICO ----------
  const dates = transactions
    .map((v) => (v.date instanceof Date ? v.date : new Date(v.date)))
    .sort((a, b) => +a - +b);

  const start = dates[0] ?? new Date();
  const end = dates[dates.length - 1] ?? new Date();

  const fractionToFutureDate: Date = new Date();
  const fractionToPastDate: Date = new Date();

  const timeBetweenTransactions = end.getTime() - start.getTime();

  fractionToFutureDate.setTime(
    fractionToFutureDate.getTime() +
      timeBetweenTransactions * FRACTION_TO_FUTURE
  );

  fractionToPastDate.setTime(
    fractionToPastDate.getTime() - timeBetweenTransactions * FRACTION_TO_PAST
  );

  return { start, end, fractionToFutureDate, fractionToPastDate };
}

export function fillDeltaByDayFuture(
  futureDays: string[],
  plannedDaily: Map<string, number>,
  transactions: Transaction[],
  fractionToPastDate: Date
): Record<string, number> {
  const deltaByDayFuture: Record<string, number> = {};

  const lastPeriodMean =
    transactions
      .filter((t) => t.date >= fractionToPastDate)
      .map((t) => t.amount * sign(t.type))
      .sort((a, b) => a - b)
      .slice(2, -2)
      .reduce((a, b) => a + b, 0) / transactions.length;

  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);

  const prevYear = new Date();
  prevYear.setFullYear(prevYear.getFullYear() - 1);

  const WEIGHT_SUM =
    (transactions.some((t) => t.date < prevMonth) ? WEIGHTS.w1 : 0) +
    (transactions.some((t) => t.date < prevYear) ? WEIGHTS.w2 : 0) +
    WEIGHTS.w3;

  futureDays.forEach((d) => {
    let monthTotal = 0;
    let monthCount = 1;
    let existingPrev = true;
    while (existingPrev) {
      const prevMonth = new Date(d);
      prevMonth.setMonth(prevMonth.getMonth() - monthCount);

      if (!transactions.some((t) => t.date < prevMonth)) {
        existingPrev = false;
      } else {
        monthTotal += getMeanSamePeriod(transactions, prevMonth, 2);
        monthCount++;
      }
    }

    const samePeriodMonthsMean = monthTotal / monthCount;

    const yearAgo = new Date(d);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    const samePeriodYearMean = getMeanSamePeriod(transactions, yearAgo, 7);

    deltaByDayFuture[d] =
      WEIGHTS.w0 * lastPeriodMean +
      (WEIGHTS.w1 / WEIGHT_SUM) * samePeriodYearMean +
      (WEIGHTS.w2 / WEIGHT_SUM) * samePeriodMonthsMean +
      (WEIGHTS.w3 / WEIGHT_SUM) * (plannedDaily.get(d) ?? 0);
  });

  return deltaByDayFuture;
}

function getMeanSamePeriod(
  transactions: Transaction[],
  d: Date,
  windowDays: number
) {
  const target = new Date(d);
  const start = startOfDay(addDays(target, -windowDays)).getTime();
  const end = endOfDay(addDays(target, +windowDays)).getTime();

  let totalPlus = 0;
  let totalMinus = 0;

  const transactionsFound = transactions.filter((t) => {
    const ts = t.date.getTime();
    return ts >= start && ts <= end;
  });

  const transactionsLength = transactionsFound.length;
  if (transactionsLength == 0) {
    return 0;
  }

  for (const t of transactionsFound) {
    if (t?.type?.name == TRANSACTION_TYPE.IN) {
      totalPlus += t.amount;
    } else if (t?.type?.name == TRANSACTION_TYPE.OUT) {
      totalMinus += t.amount;
    }
  }

  return (
    ((totalPlus || 0) -
      (totalMinus || 0)) /
    (2 * windowDays + 1)
  );
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
