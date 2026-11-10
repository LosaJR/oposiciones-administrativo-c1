import { describe, expect, it } from 'vitest';
import { buildSimulacro, buildTrainingItems } from '../src/core/exam';
import type { QStat } from '../src/core/types';
import { fullBank, profile, topics } from './helpers';

const NOW = 50_000_000_000;
const stat = (qid: string, over: Partial<QStat>): QStat => ({ qid, seen: 1, correct: 0, wrong: 0, blank: 0, lastSeen: NOW - 10 * 86_400_000, box: 0, dueAt: NOW - 1, last: 'w', ...over });

describe('entrenamiento equilibrado', () => {
  const { questions } = fullBank(10);

  it('prioriza los fallos vencidos y las no vistas frente a lo acertado hace poco', () => {
    const stats = new Map<string, QStat>();
    for (const q of questions.filter((x) => x.topic === 'I-01')) stats.set(q.id, stat(q.id, { last: 'c', correct: 1, lastSeen: NOW - 1000, dueAt: NOW + 86_400_000 }));
    for (const q of questions.filter((x) => x.topic === 'II-01').slice(0, 3)) stats.set(q.id, stat(q.id, { last: 'w', wrong: 1 }));
    const r = buildTrainingItems(questions, { count: 20, includePending: false, seed: 1, stats, now: NOW });
    const ids = r.items.map((i) => i.qid);
    expect(ids.filter((i) => i.startsWith('II-01-')).length).toBeGreaterThanOrEqual(2); // fallos pendientes entran
    expect(ids.filter((i) => i.startsWith('I-01-'))).toHaveLength(0); // lo acertado hace poco queda fuera
    expect(r.ranking[0].reason).toMatch(/fallo pendiente/);
  });

  it('reparte por temas con un tope y no incluye preguntas de supuestos', () => {
    const r = buildTrainingItems(questions, { count: 30, includePending: false, seed: 2, stats: new Map(), now: NOW });
    expect(r.items).toHaveLength(30);
    expect(r.items.every((i) => !i.qid.startsWith('CASE'))).toBe(true);
    const per = new Map<string, number>();
    for (const i of r.items) per.set(i.qid.split('-').slice(0, 2).join('-'), (per.get(i.qid.split('-').slice(0, 2).join('-')) ?? 0) + 1);
    expect(Math.max(...per.values())).toBeLessThanOrEqual(5);
    expect(per.size).toBeGreaterThanOrEqual(6);
  });

  it('favorece los temas con peor acierto histórico', () => {
    const stats = new Map<string, QStat>();
    for (const q of questions.filter((x) => x.topic === 'IV-02').slice(0, 5)) stats.set(q.id, stat(q.id, { last: 'c', correct: 0, wrong: 6, lastSeen: NOW - 20 * 86_400_000, dueAt: NOW + 1 }));
    for (const q of questions.filter((x) => x.topic === 'IV-03').slice(0, 5)) stats.set(q.id, stat(q.id, { last: 'c', correct: 6, wrong: 0, lastSeen: NOW - 20 * 86_400_000, dueAt: NOW + 1 }));
    const r = buildTrainingItems(questions, { count: 40, includePending: false, seed: 3, stats, now: NOW });
    const pos = (t: string) => Math.min(...r.ranking.map((x, i) => (x.topic === t ? i : 1e9)));
    expect(pos('IV-02')).toBeLessThan(pos('IV-03'));
  });

  it('no repite hechos y respeta el estado de auditoría', () => {
    const qs = questions.map((q, i) => (i % 7 === 0 ? { ...q, reviewStatus: 'retired' as const } : q));
    const r = buildTrainingItems(qs, { count: 50, includePending: false, seed: 4, stats: new Map(), now: NOW });
    const byId = new Map(qs.map((q) => [q.id, q]));
    const facts = r.items.map((i) => byId.get(i.qid)!.fact);
    expect(new Set(facts).size).toBe(facts.length);
    expect(r.items.every((i) => byId.get(i.qid)!.reviewStatus === 'audited_current')).toBe(true);
  });
});

describe('simulacro oficial con historial: mismo formato, menos repeticiones', () => {
  const { questions, cases } = fullBank(14);

  it('mantiene 40+30+2×20 y 100 minutos aunque haya historial', () => {
    const stats = new Map(questions.slice(0, 200).map((q) => [q.id, stat(q.id, { last: 'c', correct: 1 })]));
    const s = buildSimulacro(questions, cases, topics, profile, { includePending: false, seed: 9, now: NOW, stats });
    expect(s.part1).toHaveLength(70);
    expect(s.cases).toHaveLength(2);
    expect(s.cases.every((c) => c.items.length === 20)).toBe(true);
    expect(s.endsAt! - s.startedAt).toBe(100 * 60 * 1000);
    expect(s.format).toBe('official');
  });

  it('dentro de cada tema prefiere preguntas no vistas', () => {
    const seen = new Set(questions.filter((q) => q.kind !== 'practical' && Number(q.id.split('-').pop()) < 7).map((q) => q.id)); // la mitad de cada tema
    const stats = new Map([...seen].map((id) => [id, stat(id, { last: 'c', correct: 1, lastSeen: NOW - 1000 })]));
    let withHist = 0, without = 0;
    for (let i = 0; i < 30; i++) {
      const a = buildSimulacro(questions, cases, topics, profile, { includePending: false, seed: 100 + i, now: NOW, stats });
      const b = buildSimulacro(questions, cases, topics, profile, { includePending: false, seed: 100 + i, now: NOW });
      withHist += a.part1.filter((x) => seen.has(x.qid)).length;
      without += b.part1.filter((x) => seen.has(x.qid)).length;
    }
    expect(withHist).toBeLessThan(without * 0.4);
  });

  it('prefiere el supuesto que menos recientemente se hizo', () => {
    const stats = new Map<string, QStat>();
    for (const id of cases[0].questionIds) stats.set(id, stat(id, { last: 'c', lastSeen: NOW - 1000 }));
    let first = 0;
    for (let i = 0; i < 20; i++) {
      const only = [cases[0], cases[1]];
      const s = buildSimulacro(questions, only, topics, profile, { includePending: false, seed: 300 + i, now: NOW, stats });
      if (s.cases[0].caseId === cases[1].id) first++;
    }
    expect(first).toBe(20);
  });
});
