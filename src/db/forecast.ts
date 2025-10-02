import { db } from './index';
import { getAccountBalance, getTxTypeId } from './logic'; // se l'hai exported

export async function generatePlanOccurrences(planId: string, days = 30) {
  const plan = await db.plans.get(planId);
  if (!plan) return [];
  const sched = await db.schedules.get(plan.scheduleId);
  if (!sched) return [];
  const freq = await db.scheduleFreqs.get(sched.freqId);
  if (!freq) return [];

  const step = (d: Date) => {
    const n = freq.times || 1;
    if (freq.frequency === 'DAILY') d.setDate(d.getDate() + 1 * n);
    if (freq.frequency === 'WEEKLY') d.setDate(d.getDate() + 7 * n);
    if (freq.frequency === 'MONTHLY') {
      const target = sched.byDay ?? d.getDate();
      d.setMonth(d.getMonth() + 1 * n);
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(target, last));
    }
    if (freq.frequency === 'YEARLY') d.setFullYear(d.getFullYear() + 1 * n);
  };

  const out: any[] = [];
  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days);
  // parto da "oggi" allineato alla byDay semplice
  let d = new Date(now);
  if (freq.frequency === 'MONTHLY' && sched.byDay)
    d.setDate(
      Math.min(
        sched.byDay,
        new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
      )
    );

  while (d <= end && (!plan.endDate || d <= new Date(plan.endDate))) {
    out.push({
      date: d.toISOString(),
      amount: plan.amount,
      typeId: plan.typeId,
      accountId: plan.accountId,
      linkedPlanId: plan.id,
    });
    step(d);
  }
  return out;
}

export async function projectedBalance(accountId: string, days = 30) {
  const base = await getAccountBalance(accountId);
  const [inId, outId] = await Promise.all([
    getTxTypeId('IN'),
    getTxTypeId('OUT'),
  ]);

  const plans = await db.plans.where('accountId').equals(accountId).toArray();
  const occs = (
    await Promise.all(plans.map((p) => generatePlanOccurrences(p.id, days)))
  ).flat();

  let delta = 0;
  for (const o of occs) delta += o.typeId === inId ? o.amount : -o.amount;

  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days);
  const pendings = await db.transactions
    .where('status')
    .equals('pending')
    .filter(
      (t) =>
        t.accountId === accountId &&
        new Date(t.date) > now &&
        new Date(t.date) <= end
    )
    .toArray();
  for (const t of pendings) {
    if (t.typeId === inId) delta += t.amount;
    else if (t.typeId === outId) delta -= t.amount;
  }
  return base + delta;
}
