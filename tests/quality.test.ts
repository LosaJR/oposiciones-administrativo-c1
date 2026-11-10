import { describe, expect, it } from 'vitest';
import { bankMap, cases, profile, questions, topics } from '../src/core/bank';
import { buildSimulacro, buildTopicItems, coverageReport } from '../src/core/exam';
import type { QStat } from '../src/core/types';

const audited = questions.filter((q) => q.reviewStatus === 'audited_current');
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
const jaccard = (a: string[], b: string[]) => {
  const A = new Set(a), B = new Set(b);
  let i = 0;
  for (const x of A) if (B.has(x)) i++;
  return i / (A.size + B.size - i || 1);
};

describe('estadística del banco auditado', () => {
  it('la opción correcta no es sistemáticamente la más larga (máximo 40 %, empates no cuentan)', () => {
    const longest = audited.filter((q) => {
      const len = (id: string) => q.options.find((o) => o.id === id)!.text.length;
      const c = len(q.correctOptionId);
      return q.options.every((o) => o.id === q.correctOptionId || o.text.length < c);
    }).length;
    expect(longest / audited.length).toBeLessThanOrEqual(0.4);
  });

  it('las palabras absolutas (solo, siempre, nunca, todos...) no delatan ni a las correctas ni a los distractores (razón < 1,8)', () => {
    const ABS = /\b(siempre|nunca|únicamente|exclusivamente|en ningún caso|sin excepción|todos|ninguno|solo)\b/i;
    let c = 0, w = 0, wt = 0;
    for (const q of audited) for (const o of q.options) {
      const a = ABS.test(o.text);
      if (o.id === q.correctOptionId) c += a ? 1 : 0;
      else { wt++; w += a ? 1 : 0; }
    }
    const rc = c / audited.length, rw = w / wt;
    expect(rw).toBeLessThan(1.8 * (rc + 0.01));
    expect(rc).toBeLessThan(1.8 * (rw + 0.01));
  });

  it('la posición de la correcta está repartida (cada letra entre 18 % y 32 %)', () => {
    const pos = [0, 0, 0, 0];
    for (const q of audited) pos[q.options.findIndex((o) => o.id === q.correctOptionId)]++;
    for (const n of pos) {
      expect(n / audited.length).toBeGreaterThan(0.18);
      expect(n / audited.length).toBeLessThan(0.32);
    }
  });

  it('no hay preguntas casi duplicadas: enunciado muy parecido (Jaccard >= 0,85) Y misma respuesta correcta en el mismo tema', () => {
    // Los enunciados plantilla («Según el artículo X...») pueden parecerse léxicamente y ser hechos distintos: por eso se exige también la misma correcta.
    const correct = (q: (typeof audited)[number]) => norm(q.options.find((o) => o.id === q.correctOptionId)!.text).join(' ');
    const toks = audited.map((q) => ({ q, t: norm(q.stem), c: correct(q) }));
    const pairs: string[] = [];
    for (let i = 0; i < toks.length; i++) {
      for (let j = i + 1; j < toks.length; j++) {
        if (toks[i].q.topic === toks[j].q.topic && toks[i].c === toks[j].c && jaccard(toks[i].t, toks[j].t) >= 0.85) pairs.push(`${toks[i].q.id} ~ ${toks[j].q.id}`);
      }
    }
    expect(pairs).toEqual([]);
  });

  it('cada hecho (campo fact) se usa a lo sumo en una pregunta de teoría/ofimática y una de supuesto', () => {
    const byFact = new Map<string, string[]>();
    for (const q of audited) if (q.fact) byFact.set(q.fact, [...(byFact.get(q.fact) ?? []), q.kind]);
    for (const [fact, kinds] of byFact) {
      expect(kinds.filter((k) => k !== 'practical').length, fact).toBeLessThanOrEqual(1);
      expect(kinds.filter((k) => k === 'practical').length, fact).toBeLessThanOrEqual(1);
    }
  });
});

describe('simulacros sobre el banco real: formato, diversidad y reparto', () => {
  const N = 150;
  const sims = Array.from({ length: N }, (_, i) => buildSimulacro(questions, cases, topics, profile, { includePending: false, seed: 1000 + i, now: 1 }));
  const kindOf = (id: string) => bankMap.get(id)!.kind;

  it('respetan siempre 40 teoría + 30 ofimática + 2 supuestos de 20 cuando hay material', () => {
    const cov = coverageReport(questions, cases, topics, false, profile);
    expect(cov.theory).toBeGreaterThanOrEqual(40);
    expect(cov.office).toBeGreaterThanOrEqual(30);
    for (const s of sims) {
      expect(s.part1.filter((i) => kindOf(i.qid) === 'theory')).toHaveLength(40);
      expect(s.part1.filter((i) => kindOf(i.qid) === 'office')).toHaveLength(30);
      expect(s.cases).toHaveLength(2);
      expect(s.cases.every((c) => c.items.length === 20)).toBe(true);
      expect(s.endsAt! - s.startedAt).toBe(100 * 60 * 1000);
    }
  });

  it('dos simulacros consecutivos comparten una parte moderada de la parte 1 (solape medio < 55 %; baja al ganar profundidad el banco)', () => {
    let total = 0;
    for (let i = 1; i < N; i++) {
      const a = new Set(sims[i - 1].part1.map((x) => x.qid));
      const inter = sims[i].part1.filter((x) => a.has(x.qid)).length;
      total += inter / 70;
    }
    expect(total / (N - 1)).toBeLessThan(0.55);
  });

  it('casi todas las preguntas de teoría y ofimática pueden salir (>= 90 % aparecen en 150 simulacros)', () => {
    const seen = new Set(sims.flatMap((s) => s.part1.map((i) => i.qid)));
    const pool = audited.filter((q) => q.kind !== 'practical');
    expect(seen.size / pool.length).toBeGreaterThanOrEqual(0.9);
  });

  it('cada tema de teoría con preguntas aparece en la gran mayoría de simulacros (reparto por temas, sin cuotas oficiales)', () => {
    for (const t of topics.filter((x) => x.part === 'theory')) {
      const n = sims.filter((s) => s.part1.some((i) => bankMap.get(i.qid)!.topic === t.code)).length;
      expect(n / N, t.code).toBeGreaterThan(0.85);
    }
  });

  it('los dos supuestos de un simulacro no repiten hechos con la primera parte', () => {
    for (const s of sims.slice(0, 40)) {
      const facts = [...s.part1, ...s.cases.flatMap((c) => c.items)].map((i) => bankMap.get(i.qid)!.fact ?? i.qid);
      expect(new Set(facts).size).toBe(facts.length);
    }
  });

  it('los supuestos rotan: con 150 simulacros salen ambos supuestos disponibles', () => {
    const seen = new Set(sims.flatMap((s) => s.cases.map((c) => c.caseId)));
    expect(seen.size).toBe(cases.filter((c) => c.reviewStatus === 'audited_current').length);
  });
});

describe('tests por tema: variedad y prioridad a preguntas poco vistas', () => {
  it('con historial, las preguntas nunca vistas salen antes que las ya vistas recientemente', () => {
    const pool = audited.filter((q) => q.topic === 'III-03' && q.kind !== 'practical');
    const seen = pool.slice(0, Math.floor(pool.length / 2));
    const now = 10_000_000;
    const stats = new Map<string, QStat>(seen.map((q) => [q.id, { qid: q.id, seen: 3, correct: 3, wrong: 0, blank: 0, lastSeen: now - 1000, box: 3, dueAt: now + 86_400_000, last: 'c' as const }]));
    const n = pool.length - seen.length;
    const r = buildTopicItems(questions, { topics: ['III-03'], count: n, includePending: false, seed: 5, avoidRecent: true, stats, now });
    const seenIds = new Set(seen.map((q) => q.id));
    expect(r.items.filter((i) => seenIds.has(i.qid)).length).toBeLessThanOrEqual(pool.length - n - (pool.length - new Set(pool.map((q) => q.fact ?? q.id)).size));
  });

  it('dos tests consecutivos del mismo tema con semillas distintas no son idénticos', () => {
    const a = buildTopicItems(questions, { topics: ['III-03'], count: 10, includePending: false, seed: 1 }).items.map((i) => i.qid);
    const b = buildTopicItems(questions, { topics: ['III-03'], count: 10, includePending: false, seed: 2 }).items.map((i) => i.qid);
    expect(a).not.toEqual(b);
  });
});
