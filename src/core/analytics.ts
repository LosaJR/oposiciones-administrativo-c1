import type { Attempt } from './types';

export interface TopicAgg { correct: number; wrong: number; blank: number }

export function aggregateByTopic(attempts: Attempt[]): Map<string, TopicAgg> {
  const m = new Map<string, TopicAgg>();
  for (const a of attempts) {
    for (const [t, r] of Object.entries(a.result.byTopic)) {
      const c = m.get(t) ?? { correct: 0, wrong: 0, blank: 0 };
      c.correct += r.correct; c.wrong += r.wrong; c.blank += r.blank;
      m.set(t, c);
    }
  }
  return m;
}

const dayKey = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function activityByDay(attempts: Attempt[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of attempts) {
    const n = a.result.part1.total + (a.result.part2?.total ?? 0);
    m.set(dayKey(a.finishedAt), (m.get(dayKey(a.finishedAt)) ?? 0) + n);
  }
  return m;
}

/** Racha de dias consecutivos con actividad; hoy sin actividad no la rompe si ayer hubo. */
export function streak(attempts: Attempt[], now = Date.now()): number {
  const days = activityByDay(attempts);
  let n = 0;
  const d = new Date(now);
  if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d.getTime()))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function lastDays(count: number, now = Date.now()): { key: string; ts: number }[] {
  const out: { key: string; ts: number }[] = [];
  const d = new Date(now);
  d.setDate(d.getDate() - (count - 1));
  for (let i = 0; i < count; i++) { out.push({ key: dayKey(d.getTime()), ts: d.getTime() }); d.setDate(d.getDate() + 1); }
  return out;
}

export function accuracy(t: TopicAgg | undefined): number | null {
  if (!t) return null;
  const n = t.correct + t.wrong + t.blank;
  return n ? t.correct / n : null;
}
