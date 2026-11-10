import { describe, expect, it } from 'vitest';
import { allocate, applyAnnulments, buildReviewItems, buildSimulacro, buildTopicItems, coverageReport, depthLevel, finishSession, isAllowed, remainingMs, updateStats } from '../src/core/exam';
import { estimateScore, formatDirect, scorePart, thirds, verdictExam, verdictPart } from '../src/core/scoring';
import { mulberry32, shuffle } from '../src/core/rng';
import type { QStat } from '../src/core/types';
import { fullBank, mkQuestion, profile, topics } from './helpers';

const bankOf = (qs: ReturnType<typeof fullBank>['questions']) => new Map(qs.map((q) => [q.id, q]));

describe('estructura del simulacro oficial', () => {
  const { questions, cases } = fullBank();
  const s = buildSimulacro(questions, cases, topics, profile, { includePending: false, seed: 7, now: 1_000_000 });

  it('tiene exactamente 40 teoria + 30 informatica + 2 supuestos de 20', () => {
    const bank = bankOf(questions);
    const th = s.part1.filter((i) => bank.get(i.qid)!.kind === 'theory').length;
    const of = s.part1.filter((i) => bank.get(i.qid)!.kind === 'office').length;
    expect(th).toBe(40);
    expect(of).toBe(30);
    expect(s.part1).toHaveLength(70);
    expect(s.cases).toHaveLength(2);
    expect(s.cases.every((c) => c.items.length === 20)).toBe(true);
    expect(s.partial).toBe(false);
  });

  it('dura 100 minutos exactos de reloj de pared', () => {
    expect(profile.durationMinutes).toBe(100);
    expect(s.endsAt! - s.startedAt).toBe(100 * 60 * 1000);
    expect(remainingMs(s, s.startedAt + 99 * 60000)).toBe(60000);
    expect(remainingMs(s, s.endsAt! + 5)).toBe(0);
  });

  it('no repite preguntas ni hechos entre parte 1 y supuestos', () => {
    const bank = bankOf(questions);
    const ids = [...s.part1, ...s.cases.flatMap((c) => c.items)].map((i) => i.qid);
    expect(new Set(ids).size).toBe(ids.length);
    const facts = ids.map((id) => bank.get(id)!.fact);
    expect(new Set(facts).size).toBe(facts.length);
  });

  it('las reservas son un conjunto aparte y no se mezclan con el examen ordinario', () => {
    const main = new Set(s.part1.map((i) => i.qid));
    expect(s.reserve.part1.length).toBeLessThanOrEqual(5);
    expect(s.reserve.part1.every((i) => !main.has(i.qid))).toBe(true);
    const out = applyAnnulments(s, [s.part1[0].qid]);
    expect(out.part1).toHaveLength(70);
    expect(out.part1.some((i) => i.qid === s.part1[0].qid)).toBe(false);
  });

  it('un banco incompleto produce simulacro parcial con carencias visibles', () => {
    const small = fullBank(1);
    const p = buildSimulacro(small.questions.filter((q) => !q.topic.startsWith('IV')), small.cases, topics, profile, { includePending: false, seed: 1 });
    expect(p.partial).toBe(true);
    expect(p.label).toMatch(/parcial/);
    expect(p.partialNotes.join(' ')).toMatch(/sin preguntas/);
    const cov = coverageReport(small.questions.filter((q) => !q.topic.startsWith('IV')), small.cases, topics, false, profile);
    expect(cov.complete).toBe(false);
    expect(cov.missing).toContain('IV-01');
  });
});

describe('reservas de los supuestos', () => {
  const { questions, cases } = fullBank();
  const s = buildSimulacro(questions, cases, topics, profile, { includePending: false, seed: 11 });

  it('cada supuesto lleva hasta 5 reservas propias, fuera de sus 20 preguntas y de la primera parte', () => {
    const main = new Set([...s.part1, ...s.cases.flatMap((c) => c.items)].map((i) => i.qid));
    for (const c of s.cases) {
      const res = s.reserve.cases[c.caseId];
      expect(res).toHaveLength(5);
      expect(res.every((r) => r.qid.startsWith(c.caseId) && !main.has(r.qid))).toBe(true);
      expect(res.map((r) => r.qid)).toEqual([0, 1, 2, 3, 4].map((i) => `${c.caseId}-R${i}`));
    }
    expect(s.format).toBe('official');
  });

  it('anular una pregunta de un supuesto la sustituye por la primera reserva de ESE supuesto y no consume la del otro', () => {
    const [a, b] = s.cases;
    const victim = a.items[3].qid;
    const out = applyAnnulments(s, [victim]);
    expect(out.cases[0].items).toHaveLength(20);
    expect(out.cases[0].items.some((i) => i.qid === victim)).toBe(false);
    expect(out.cases[0].items.map((i) => i.qid)).toContain(`${a.caseId}-R0`);
    expect(out.reserve.cases[a.caseId]).toHaveLength(4);
    expect(out.reserve.cases[b.caseId]).toHaveLength(5);
    expect(out.cases[1].items).toEqual(b.items);
  });

  it('varias anulaciones consumen las reservas por orden; sin reservas suficientes el supuesto se acorta (limitacion documentada)', () => {
    const a = s.cases[0];
    const ids = a.items.slice(0, 7).map((i) => i.qid);
    const out = applyAnnulments(s, ids);
    expect(out.cases[0].items.map((i) => i.qid).filter((q) => q.includes('-R'))).toEqual([0, 1, 2, 3, 4].map((i) => `${a.caseId}-R${i}`));
    expect(out.cases[0].items).toHaveLength(18);
    expect(out.reserve.cases[a.caseId]).toHaveLength(0);
  });

  it('la respuesta guardada de una pregunta anulada deja de puntuar', () => {
    const victim = s.cases[0].items[0].qid;
    const out = applyAnnulments({ ...s, answers: { [victim]: 'o0' } }, [victim]);
    expect(out.answers[victim]).toBeUndefined();
  });

  it('un supuesto sin reservas declaradas sigue siendo valido', () => {
    const noRes = cases.map((c) => ({ ...c, reserveQuestionIds: undefined }));
    const t = buildSimulacro(questions, noRes, topics, profile, { includePending: false, seed: 3 });
    expect(Object.values(t.reserve.cases).every((r) => r.length === 0)).toBe(true);
    expect(t.cases.every((c) => c.items.length === 20)).toBe(true);
  });
});

describe('profundidad por tema (independiente de la cobertura)', () => {
  it('niveles: 0 ninguna, <5 inicial, 5-9 basica, >=10 objetivo', () => {
    expect([0, 1, 4, 5, 9, 10, 25].map(depthLevel)).toEqual(['none', 'initial', 'initial', 'basic', 'basic', 'target', 'target']);
  });
  it('un tema con una sola pregunta cuenta como cubierto pero NO permite llamar oficial al simulacro', () => {
    const full = fullBank(12);
    const thin = full.questions.filter((q) => q.kind === 'practical' || q.topic !== 'IV-04' || q.id.endsWith('-0'));
    const cov = coverageReport(thin, full.cases, topics, false, profile);
    expect(cov.missing).toEqual([]);
    expect(cov.shallow).toEqual(['IV-04']);
    expect(cov.coverageComplete).toBe(true);
    expect(cov.complete).toBe(false);
    expect(buildSimulacro(thin, full.cases, topics, profile, { includePending: false, seed: 4 }).format).toBe('coverage-insufficient');
  });
});

describe('formato del simulacro', () => {
  it('official, coverage-insufficient y partial se distinguen', () => {
    const full = fullBank();
    expect(buildSimulacro(full.questions, full.cases, topics, profile, { includePending: false, seed: 1 }).format).toBe('official');
    const noIV = full.questions.filter((q) => !q.topic.startsWith('IV-0'));
    expect(buildSimulacro(noIV, full.cases, topics, profile, { includePending: false, seed: 1 }).format).toBe('coverage-insufficient');
    expect(buildSimulacro(full.questions, full.cases.slice(0, 1), topics, profile, { includePending: false, seed: 1 }).format).toBe('partial');
    const few = fullBank(1);
    expect(buildSimulacro(few.questions, few.cases, topics, profile, { includePending: false, seed: 1 }).format).toBe('partial');
  });
});

describe('barajado y aleatoriedad', () => {
  it('conserva la clave correcta como ID aunque cambie la posicion', () => {
    const { questions, cases } = fullBank();
    const bank = bankOf(questions);
    const s = buildSimulacro(questions, cases, topics, profile, { includePending: false, seed: 99 });
    let moved = 0;
    for (const it of s.part1) {
      const q = bank.get(it.qid)!;
      expect([...it.order].sort()).toEqual(q.options.map((o) => o.id).sort());
      expect(it.order).toContain(q.correctOptionId);
      if (it.order[0] !== q.options[0].id) moved++;
    }
    expect(moved).toBeGreaterThan(20);
  });

  it('dos intentos con semillas distintas dan orden distinto; misma semilla repite', () => {
    const { questions, cases } = fullBank();
    const a = buildSimulacro(questions, cases, topics, profile, { includePending: false, seed: 1 });
    const b = buildSimulacro(questions, cases, topics, profile, { includePending: false, seed: 2 });
    const a2 = buildSimulacro(questions, cases, topics, profile, { includePending: false, seed: 1 });
    expect(a.part1.map((i) => i.qid)).not.toEqual(b.part1.map((i) => i.qid));
    expect(a.part1).toEqual(a2.part1);
  });

  it('shuffle es una permutacion', () => {
    const r = shuffle([1, 2, 3, 4, 5, 6], mulberry32(3));
    expect([...r].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('reparto proporcional respeta topes de disponibilidad', () => {
    const al = allocate(10, [{ key: 'a', weight: 1, avail: 2 }, { key: 'b', weight: 1, avail: 20 }]);
    expect(al).toEqual({ a: 2, b: 8 });
  });
});

describe('puntuacion en tercios exactos', () => {
  it('aciertos - errores/3 con enteros', () => {
    expect(thirds(34, 7)).toBe(95);
    expect(thirds(13, 1)).toBe(38);
    expect(formatDirect(95)).toBe('31,67');
    expect(formatDirect(38)).toBe('12,67');
  });

  it('el corte historico 31,67 equivale a 95/3 y 31,33 NO lo supera', () => {
    expect(verdictPart(95, 95)).toBe('pass');
    expect(verdictPart(94, 95)).toBe('fail'); // 31,33
    expect(verdictPart(38, 38)).toBe('pass');
    expect(verdictPart(37, 38)).toBe('fail');
  });

  it('en blanco puntua 0 y el error resta un tercio', () => {
    const { questions } = fullBank(1);
    const bank = bankOf(questions);
    const items = questions.slice(0, 3).map((q) => ({ qid: q.id, order: q.options.map((o) => o.id) }));
    const r = scorePart(items, { [items[0].qid]: 'o0', [items[1].qid]: 'o1' }, bank);
    expect(r).toMatchObject({ correct: 1, wrong: 1, blank: 1, thirds: 2 });
  });

  it('doble eliminatoria: parte 1 suspensa invalida el conjunto', () => {
    expect(verdictExam(94, 60, 95, 38)).toEqual({ part1: 'fail', part2: 'not_evaluated', global: 'fail' });
    expect(verdictExam(120, 37, 95, 38).global).toBe('fail');
    expect(verdictExam(120, 50, 95, 38).global).toBe('pass');
  });

  it('convocatoria futura sin cortes oficiales no declara aprobado ni suspenso', () => {
    expect(profile.futureCall.part1MinThirds).toBeNull();
    expect(verdictPart(200, profile.futureCall.part1MinThirds)).toBe('unknown');
    expect(verdictExam(200, 60, null, null).global).toBe('unknown');
  });

  it('cortes historicos del perfil coinciden con la nota INAP', () => {
    expect(profile.historical.general.part1MinThirds).toBe(95);
    expect(profile.historical.general.part2MinThirds).toBe(38);
    expect(profile.historical.cupo13.part1MinThirds).toBe(63);
    expect(profile.historical.cupo13.part2MinThirds).toBe(18);
  });

  it('la estimacion lineal fija M en 25 y N en 50', () => {
    expect(estimateScore(95, 95, 210)).toBe(25);
    expect(estimateScore(210, 95, 210)).toBe(50);
    expect(estimateScore(0, 95, 210)).toBe(0);
  });
});

describe('supuesto unico y cierre', () => {
  it('solo se corrige el supuesto elegido; sin eleccion la parte 2 no se corrige', () => {
    const { questions, cases } = fullBank();
    const bank = bankOf(questions);
    const s = buildSimulacro(questions, cases, topics, profile, { includePending: false, seed: 5 });
    for (const c of s.cases) for (const it of c.items) s.answers[it.qid] = 'o0';
    const none = finishSession(s, bank, 1);
    expect(none.result.part2).toBeNull();
    const chosen = finishSession({ ...s, chosenCase: s.cases[0].caseId }, bank, 1);
    expect(chosen.result.part2).toMatchObject({ correct: 20, total: 20, thirds: 60 });
  });
});

describe('filtrado por auditoria y obsolescencia', () => {
  it('solo audited_current entra en produccion; pendientes solo con el interruptor del laboratorio', () => {
    const q1 = mkQuestion('a', 'I-01');
    const q2 = mkQuestion('b', 'I-01', { reviewStatus: 'source_linked_pending_individual_audit' });
    const q3 = mkQuestion('c', 'I-01', { reviewStatus: 'retired' });
    const q4 = mkQuestion('d', 'I-01', { reviewStatus: 'stale' });
    expect([q1, q2, q3, q4].filter((q) => isAllowed(q, false)).map((q) => q.id)).toEqual(['a']);
    expect([q1, q2, q3, q4].filter((q) => isAllowed(q, true)).map((q) => q.id)).toEqual(['a', 'b']);
  });

  it('una pregunta retirada sale de tests nuevos pero sigue puntuando en intentos pasados', () => {
    const qs = [mkQuestion('a', 'I-01'), mkQuestion('b', 'I-01'), mkQuestion('c', 'I-01')];
    const s0 = buildTopicItems(qs, { topics: ['I-01'], count: 'max', includePending: false, seed: 1 });
    expect(s0.items).toHaveLength(3);
    const old = { part1: s0.items, answers: { a: 'o0', b: 'o1', c: null } };
    qs[0] = { ...qs[0], reviewStatus: 'retired' };
    const s1 = buildTopicItems(qs, { topics: ['I-01'], count: 'max', includePending: false, seed: 1 });
    expect(s1.items.map((i) => i.qid)).not.toContain('a');
    const r = scorePart(old.part1, old.answers, bankOf(qs));
    expect(r.correct).toBe(1);
    expect(r.wrong).toBe(1);
  });

  it('test por tema: sin repeticiones, respeta el maximo y las preguntas practicas quedan fuera', () => {
    const { questions } = fullBank();
    const r = buildTopicItems(questions, { topics: ['III-03'], count: 50, includePending: false, seed: 3 });
    expect(r.items).toHaveLength(12);
    expect(r.shortfall).toBe(38);
    expect(new Set(r.items.map((i) => i.qid)).size).toBe(12);
    expect(r.items.every((i) => !i.qid.startsWith('CASE'))).toBe(true);
  });
});

describe('repaso espaciado', () => {
  it('un fallo vuelve a la caja 0 y aparece en repaso; acierto sube caja', () => {
    const { questions } = fullBank(2);
    const bank = bankOf(questions);
    const items = buildTopicItems(questions, { topics: ['I-01'], count: 'max', includePending: false, seed: 1 }).items;
    const [i0, i1] = items;
    const s = { id: 'x', kind: 'topic' as const, mode: 'exam' as const, label: 'x', seed: 1, startedAt: 0, partial: false, format: 'topic' as const, partialNotes: [], includesPending: false, part1: items, cases: [], chosenCase: null, reserve: { part1: [], cases: {} }, answers: { [i0.qid]: 'o0', [i1.qid]: 'o2' }, flags: {}, cursor: 0 };
    const att = finishSession(s, bank, 10_000);
    const stats = new Map<string, QStat>(updateStats(new Map(), att, bank).map((x) => [x.qid, x]));
    expect(stats.get(i0.qid)!.box).toBe(1);
    expect(stats.get(i1.qid)!.box).toBe(0);
    const rev = buildReviewItems(questions, stats, 10, false, 1, 10_000);
    expect(rev.map((r) => r.qid)).toContain(i1.qid);
    expect(rev.map((r) => r.qid)).not.toContain(i0.qid);
  });
});
