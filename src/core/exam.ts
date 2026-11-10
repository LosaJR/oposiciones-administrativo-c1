import { mulberry32, shuffle } from './rng';
import { scorePart } from './scoring';
import type {
  Attempt, SimulacroFormat, CaseFile, ExamItem, ExamProfile, Question, QStat, Session, SessionKind, SessionMode, Topic,
} from './types';

/* ---------- Filtrado por estado de auditoria ---------- */

export function isAllowed(q: Question, includePending: boolean): boolean {
  if (q.reviewStatus === 'audited_current') return true;
  return includePending && q.reviewStatus === 'source_linked_pending_individual_audit';
}

export function makeItem(q: Question, rnd: () => number): ExamItem {
  return { qid: q.id, order: shuffle(q.options.map((o) => o.id), rnd) };
}

/** Elimina preguntas con la misma clave de hecho (conserva la primera). */
function dedupeByFact(qs: Question[], used: Set<string>): Question[] {
  const out: Question[] = [];
  for (const q of qs) {
    const key = q.fact ?? q.id;
    if (used.has(key)) continue;
    used.add(key);
    out.push(q);
  }
  return out;
}

/* ---------- Reparto proporcional (Sainte-Lague) con tope por disponibilidad ---------- */

export function allocate(total: number, groups: { key: string; weight: number; avail: number }[]): Record<string, number> {
  const alloc: Record<string, number> = {};
  for (const g of groups) alloc[g.key] = 0;
  for (let i = 0; i < total; i++) {
    let best: { key: string; score: number } | null = null;
    for (const g of groups) {
      if (alloc[g.key] >= g.avail) continue;
      const score = g.weight / (2 * alloc[g.key] + 1);
      if (!best || score > best.score) best = { key: g.key, score };
    }
    if (!best) break;
    alloc[best.key]++;
  }
  return alloc;
}

/* ---------- Test por tema ---------- */

export interface TopicTestOptions {
  topics: string[];
  count: number | 'max';
  includePending: boolean;
  seed: number;
  avoidRecent?: boolean;
  stats?: Map<string, QStat>;
  now?: number;
  recentWindowMs?: number;
}

export function buildTopicItems(questions: Question[], o: TopicTestOptions): { items: ExamItem[]; available: number; shortfall: number } {
  const now = o.now ?? Date.now();
  const rnd = mulberry32(o.seed);
  const topicSet = new Set(o.topics);
  const raw = questions.filter((q) => topicSet.has(q.topic) && q.kind !== 'practical' && isAllowed(q, o.includePending));
  const pool = dedupeByFact(shuffle(raw, rnd), new Set());
  const window = o.recentWindowMs ?? 3 * 24 * 3600 * 1000;
  const bucket = (q: Question): number => {
    const s = o.stats?.get(q.id);
    if (!s) return 0; // nunca vista
    if (s.dueAt <= now && s.last !== 'c') return 0; // fallo pendiente de repaso
    if (o.avoidRecent && now - s.lastSeen < window) return 2;
    return 1;
  };
  const sorted = pool.map((q, i) => ({ q, i, b: bucket(q) })).sort((a, b) => a.b - b.b || a.i - b.i).map((x) => x.q);
  const n = o.count === 'max' ? sorted.length : Math.min(o.count, sorted.length);
  const chosen = shuffle(sorted.slice(0, n), rnd);
  return {
    items: chosen.map((q) => makeItem(q, rnd)),
    available: sorted.length,
    shortfall: o.count === 'max' ? 0 : Math.max(0, o.count - sorted.length),
  };
}

/** Repaso espaciado: fallos vencidos primero, luego los mas debiles. */
export function buildReviewItems(questions: Question[], stats: Map<string, QStat>, count: number, includePending: boolean, seed: number, now = Date.now()): ExamItem[] {
  const rnd = mulberry32(seed);
  const cand = questions
    .filter((q) => q.kind !== 'practical' && isAllowed(q, includePending) && stats.has(q.id))
    .map((q) => ({ q, s: stats.get(q.id)! }))
    .filter(({ s }) => s.last !== 'c' || s.dueAt <= now);
  const ranked = shuffle(cand, rnd).sort((a, b) => {
    const da = a.s.dueAt <= now ? 0 : 1, db = b.s.dueAt <= now ? 0 : 1;
    if (da !== db) return da - db;
    return a.s.box - b.s.box;
  });
  return ranked.slice(0, count).map(({ q }) => makeItem(q, rnd));
}

/* ---------- Cobertura ---------- */

/** Profundidad por tema, independiente de la cobertura: cuántas preguntas auditadas distintas (hechos distintos) tiene cada tema. */
export const DEPTH = { min: 5, target: 10 } as const;
export type DepthLevel = 'none' | 'initial' | 'basic' | 'target';
export function depthLevel(n: number): DepthLevel {
  return n === 0 ? 'none' : n < DEPTH.min ? 'initial' : n < DEPTH.target ? 'basic' : 'target';
}

export interface Coverage {
  perTopic: Record<string, number>;
  missing: string[];
  theory: number;
  office: number;
  casesReady: number;
  /** temas con al menos una pregunta pero menos de DEPTH.min */
  shallow: string[];
  /** todos los temas con al menos una pregunta, volumen suficiente y dos supuestos (sin exigir profundidad) */
  coverageComplete: boolean;
  /** cobertura completa Y todos los temas con al menos DEPTH.min preguntas: la unica que permite llamar «oficial» a un simulacro */
  complete: boolean;
}

export function eligibleCases(cases: CaseFile[], bank: Map<string, Question>, includePending: boolean, per = 20): CaseFile[] {
  return cases.filter((c) => {
    if (c.reviewStatus === 'retired') return false;
    if (c.reviewStatus !== 'audited_current' && !(includePending && c.reviewStatus === 'source_linked_pending_individual_audit')) return false;
    const qs = c.questionIds.map((id) => bank.get(id));
    return qs.length >= per && qs.every((q) => q && isAllowed(q, includePending));
  });
}

export function coverageReport(questions: Question[], cases: CaseFile[], topics: Topic[], includePending: boolean, profile: ExamProfile): Coverage {
  const bank = new Map(questions.map((q) => [q.id, q]));
  const perTopic: Record<string, number> = {};
  for (const t of topics) perTopic[t.code] = 0;
  for (const q of questions) {
    if (q.kind === 'practical' || !isAllowed(q, includePending)) continue;
    if (q.topic in perTopic) perTopic[q.topic]++;
  }
  const missing = topics.filter((t) => perTopic[t.code] === 0).map((t) => t.code);
  const theory = topics.filter((t) => t.part === 'theory').reduce((a, t) => a + perTopic[t.code], 0);
  const office = topics.filter((t) => t.part === 'office').reduce((a, t) => a + perTopic[t.code], 0);
  const casesReady = eligibleCases(cases, bank, includePending, profile.part2.questions).length;
  const shallow = topics.filter((t) => perTopic[t.code] > 0 && perTopic[t.code] < DEPTH.min).map((t) => t.code);
  const coverageComplete = missing.length === 0 && theory >= profile.part1.theory && office >= profile.part1.office && casesReady >= profile.part2.casesOffered;
  const complete = coverageComplete && shallow.length === 0;
  return { perTopic, missing, theory, office, casesReady, shallow, coverageComplete, complete };
}

/* ---------- Simulacro completo ---------- */

export interface SimulacroOptions {
  includePending: boolean; seed: number; now?: number;
  /** historial: si se da, dentro de cada tema se prefieren las preguntas nunca vistas o vistas hace más tiempo.
   *  No cambia el formato (40+30+2×20) ni el reparto por temas: solo QUÉ preguntas concretas de cada tema salen. */
  stats?: Map<string, QStat>;
}

/** Orden de preferencia: nunca vistas, luego las vistas hace más tiempo; el azar desempata. */
function freshnessOrder(list: Question[], stats: Map<string, QStat> | undefined, rnd: () => number): Question[] {
  const shuffled = shuffle(list, rnd);
  if (!stats) return shuffled;
  return shuffled
    .map((q, i) => ({ q, i, t: stats.get(q.id)?.lastSeen ?? 0 }))
    .sort((a, b) => a.t - b.t || a.i - b.i)
    .map((x) => x.q);
}

export function buildSimulacro(questions: Question[], cases: CaseFile[], topics: Topic[], profile: ExamProfile, o: SimulacroOptions): Session {
  const now = o.now ?? Date.now();
  const rnd = mulberry32(o.seed);
  const bank = new Map(questions.map((q) => [q.id, q]));
  const used = new Set<string>();
  const notes: string[] = [];

  // 1) Supuestos: se eligen primero para excluir sus hechos de la parte 1.
  // Supuestos: se prefieren los menos recientes (media de última vez vista de sus preguntas); el azar desempata.
  const caseAge = (c: CaseFile) => c.questionIds.reduce((a, id) => a + (o.stats?.get(id)?.lastSeen ?? 0), 0) / c.questionIds.length;
  const elig = o.stats
    ? shuffle(eligibleCases(cases, bank, o.includePending, profile.part2.questions), rnd)
        .map((c, i) => ({ c, i, a: caseAge(c) })).sort((x, y) => x.a - y.a || x.i - y.i).map((x) => x.c)
    : shuffle(eligibleCases(cases, bank, o.includePending, profile.part2.questions), rnd);
  const chosenCases = elig.slice(0, profile.part2.casesOffered);
  if (chosenCases.length < profile.part2.casesOffered) {
    notes.push(`Solo hay ${chosenCases.length} supuesto(s) con 20 preguntas disponibles; el examen oficial ofrece ${profile.part2.casesOffered} para elegir uno.`);
  }
  const caseReserve: Record<string, ExamItem[]> = {};
  const caseSections = chosenCases.map((c) => {
    const qs = c.questionIds.slice(0, profile.part2.questions).map((id) => bank.get(id)!);
    for (const q of qs) used.add(q.fact ?? q.id);
    // Reservas del supuesto (bases: hasta 5 por supuesto, valoradas por su orden si se anula alguna de las 20).
    // Se conserva el orden declarado en el supuesto; solo se barajan las alternativas.
    const res = (c.reserveQuestionIds ?? [])
      .map((id) => bank.get(id))
      .filter((q): q is Question => !!q && q.caseId === c.id && isAllowed(q, o.includePending))
      .slice(0, profile.part2.reserve);
    for (const q of res) used.add(q.fact ?? q.id);
    caseReserve[c.id] = res.map((q) => makeItem(q, rnd));
    return { caseId: c.id, items: shuffle(qs, rnd).map((q) => makeItem(q, rnd)) };
  });

  // 2) Parte 1: reparto proporcional al numero de temas del bloque (heuristica, NO cuota oficial).
  const section = (part: 'theory' | 'office', total: number): { picked: Question[]; reserve: Question[] } => {
    const ts = topics.filter((t) => t.part === part);
    const pools: Record<string, Question[]> = {};
    for (const t of ts) {
      const raw = questions.filter((q) => q.topic === t.code && q.kind !== 'practical' && isAllowed(q, o.includePending));
      pools[t.code] = freshnessOrder(raw, o.stats, rnd);
    }
    // Excluir hechos ya usados por los supuestos y duplicados internos.
    const local = new Set(used);
    for (const t of ts) pools[t.code] = dedupeByFact(pools[t.code], local);
    const al = allocate(total + 5, ts.map((t) => ({ key: t.code, weight: 1, avail: pools[t.code].length })));
    const al0 = allocate(total, ts.map((t) => ({ key: t.code, weight: 1, avail: pools[t.code].length })));
    const picked: Question[] = [];
    const reserve: Question[] = [];
    for (const t of ts) {
      const n0 = al0[t.code];
      picked.push(...pools[t.code].slice(0, n0));
      const extra = Math.max(0, al[t.code] - n0);
      reserve.push(...pools[t.code].slice(n0, n0 + extra));
    }
    for (const q of picked) used.add(q.fact ?? q.id);
    return { picked, reserve };
  };
  const th = section('theory', profile.part1.theory);
  const of = section('office', profile.part1.office);
  if (th.picked.length < profile.part1.theory) notes.push(`Teoría (bloques I-V): ${th.picked.length} de ${profile.part1.theory} preguntas disponibles.`);
  if (of.picked.length < profile.part1.office) notes.push(`Ofimática (bloque VI): ${of.picked.length} de ${profile.part1.office} preguntas disponibles.`);

  const cov = coverageReport(questions, cases, topics, o.includePending, profile);
  if (cov.missing.length) notes.push(`Temas sin preguntas habilitadas: ${cov.missing.length} de ${topics.length}.`);
  if (cov.shallow.length) notes.push(`Temas con menos de ${DEPTH.min} preguntas auditadas (poca profundidad): ${cov.shallow.length} de ${topics.length}.`);

  const part1Q = [...shuffle(th.picked, rnd), ...shuffle(of.picked, rnd)];
  const reserveQ = shuffle([...th.reserve.slice(0, 3), ...of.reserve.slice(0, 2)], rnd).slice(0, profile.part1.reservePerPart);
  const partial = notes.length > 0;
  // Formato: estructura oficial (70 + dos supuestos de 20) y, aparte, cobertura tematica.
  const structural = th.picked.length === profile.part1.theory && of.picked.length === profile.part1.office
    && caseSections.length === profile.part2.casesOffered && caseSections.every((c) => c.items.length === profile.part2.questions);
  const format: SimulacroFormat = !structural ? 'partial' : cov.complete ? 'official' : 'coverage-insufficient';
  return {
    id: `s-${now.toString(36)}-${o.seed.toString(36)}`,
    kind: 'simulacro',
    mode: 'exam',
    label: format === 'official' ? 'Simulacro AGE C1' : format === 'coverage-insufficient' ? 'Simulacro con formato oficial y cobertura temática insuficiente' : 'Simulacro parcial de entrenamiento',
    format,
    seed: o.seed,
    startedAt: now,
    endsAt: now + profile.durationMinutes * 60 * 1000,
    partial,
    partialNotes: notes,
    includesPending: o.includePending,
    part1: part1Q.map((q) => makeItem(q, rnd)),
    cases: caseSections,
    chosenCase: null,
    reserve: { part1: reserveQ.map((q) => makeItem(q, rnd)), cases: caseReserve },
    answers: {},
    flags: {},
    cursor: 0,
  };
}

/** Sustituye preguntas anuladas por reservas, en orden. Las reservas nunca forman parte del examen ordinario. */
export function applyAnnulments(s: Session, annulled: string[]): Session {
  const ann = new Set(annulled);
  const swap = (items: ExamItem[], reserve: ExamItem[]): { items: ExamItem[]; reserve: ExamItem[] } => {
    const res = reserve.slice();
    const out = items.map((it) => (ann.has(it.qid) && res.length ? res.shift()! : it)).filter((it) => !ann.has(it.qid));
    return { items: out, reserve: res };
  };
  const p1 = swap(s.part1, s.reserve.part1);
  // Cada supuesto tiene sus propias reservas: una anulacion en un supuesto nunca consume reservas de otro.
  const caseReserve: Record<string, ExamItem[]> = { ...s.reserve.cases };
  const cases = s.cases.map((c) => {
    const r = swap(c.items, s.reserve.cases[c.caseId] ?? []);
    caseReserve[c.caseId] = r.reserve;
    return { ...c, items: r.items };
  });
  // Una respuesta guardada para una pregunta anulada no puntua.
  const answers = Object.fromEntries(Object.entries(s.answers).filter(([k]) => !ann.has(k)));
  return { ...s, part1: p1.items, cases, answers, reserve: { part1: p1.reserve, cases: caseReserve } };
}

export function makeSession(kind: SessionKind, mode: SessionMode, label: string, items: ExamItem[], seed: number, includePending: boolean, now = Date.now()): Session {
  return {
    id: `t-${now.toString(36)}-${seed.toString(36)}`, kind, mode, label, seed, startedAt: now,
    partial: false, format: 'topic', partialNotes: [], includesPending: includePending, part1: items, cases: [], chosenCase: null,
    reserve: { part1: [], cases: {} }, answers: {}, flags: {}, cursor: 0,
  };
}

/* ---------- Cierre y estadisticas ---------- */

export function remainingMs(s: Session, now = Date.now()): number | null {
  return s.endsAt === undefined ? null : Math.max(0, s.endsAt - now);
}

export function finishSession(s: Session, bank: Map<string, Question>, now = Date.now(), timedOut = false): Attempt {
  const part1 = scorePart(s.part1, s.answers, bank);
  const chosen = s.cases.find((c) => c.caseId === s.chosenCase);
  const part2 = chosen ? scorePart(chosen.items, s.answers, bank) : null;
  const scored = [...s.part1, ...(chosen ? chosen.items : [])];
  const byTopic: Attempt['result']['byTopic'] = {};
  const qversions: Record<string, number> = {};
  for (const it of [...s.part1, ...s.cases.flatMap((c) => c.items)]) {
    const q = bank.get(it.qid);
    if (q) qversions[q.id] = q.version;
  }
  for (const it of scored) {
    const q = bank.get(it.qid);
    if (!q) continue;
    const a = s.answers[it.qid] ?? null;
    const t = (byTopic[q.topic] ??= { correct: 0, wrong: 0, blank: 0 });
    if (a === null) t.blank++;
    else if (a === q.correctOptionId) t.correct++;
    else t.wrong++;
  }
  return {
    id: s.id, kind: s.kind, mode: s.mode, label: s.label, seed: s.seed, startedAt: s.startedAt, finishedAt: now, timedOut,
    partial: s.partial, format: s.format, partialNotes: s.partialNotes, includesPending: s.includesPending,
    part1: s.part1, cases: s.cases, chosenCase: s.chosenCase, answers: s.answers, flags: s.flags, qversions,
    result: { part1, part2, byTopic },
  };
}

const DAY = 24 * 3600 * 1000;
const INTERVALS = [0, 1, 3, 7, 16, 35];

export function updateStats(prev: Map<string, QStat>, a: Attempt, bank: Map<string, Question>): QStat[] {
  const chosen = a.cases.find((c) => c.caseId === a.chosenCase);
  const scored = [...a.part1, ...(chosen ? chosen.items : [])];
  const out: QStat[] = [];
  for (const it of scored) {
    const q = bank.get(it.qid);
    if (!q) continue;
    const ans = a.answers[it.qid] ?? null;
    const old = prev.get(it.qid) ?? { qid: it.qid, seen: 0, correct: 0, wrong: 0, blank: 0, lastSeen: 0, box: 0, dueAt: 0, last: 'b' as const };
    const s: QStat = { ...old, seen: old.seen + 1, lastSeen: a.finishedAt };
    if (ans === null) { s.blank++; s.last = 'b'; s.box = 0; }
    else if (ans === q.correctOptionId) { s.correct++; s.last = 'c'; s.box = Math.min(5, old.box + 1); }
    else { s.wrong++; s.last = 'w'; s.box = 0; }
    s.dueAt = a.finishedAt + INTERVALS[s.box] * DAY;
    out.push(s);
  }
  return out;
}


/* ---------- Entrenamiento equilibrado (no es un simulacro) ---------- */

export interface TrainingOptions {
  count: number; includePending: boolean; seed: number; now?: number;
  stats: Map<string, QStat>;
  /** ventana en la que un acierto reciente se considera «ya visto» */
  recentMs?: number;
}

export interface TrainingScore { qid: string; topic: string; score: number; reason: string }

/**
 * Prioriza: fallos y blancos vencidos, temas con peor acierto, temas poco estudiados y preguntas no vistas.
 * Penaliza lo acertado hace poco. Limita las preguntas por tema para repartir el estudio y no repite hechos.
 * NO usa cuotas oficiales ni pretende imitar el formato del examen.
 */
export function buildTrainingItems(questions: Question[], o: TrainingOptions): { items: ExamItem[]; ranking: TrainingScore[] } {
  const now = o.now ?? Date.now();
  const recent = o.recentMs ?? 3 * 24 * 3600 * 1000;
  const rnd = mulberry32(o.seed);
  const pool = questions.filter((q) => q.kind !== 'practical' && isAllowed(q, o.includePending));
  const byTopic = new Map<string, Question[]>();
  for (const q of pool) byTopic.set(q.topic, [...(byTopic.get(q.topic) ?? []), q]);

  // Estado por tema: acierto histórico y proporción de preguntas ya vistas.
  const topicInfo = new Map<string, { acc: number | null; seenRatio: number }>();
  for (const [t, qs] of byTopic) {
    let seen = 0, c = 0, n = 0;
    for (const q of qs) {
      const s = o.stats.get(q.id);
      if (s) { seen++; c += s.correct; n += s.correct + s.wrong + s.blank; }
    }
    topicInfo.set(t, { acc: n >= 3 ? c / n : null, seenRatio: seen / qs.length });
  }

  const ranking: TrainingScore[] = pool.map((q) => {
    const s = o.stats.get(q.id);
    const ti = topicInfo.get(q.topic)!;
    let score = rnd() * 0.5; // desempate
    const why: string[] = [];
    if (s && s.last !== 'c' && s.dueAt <= now) { score += 4; why.push('fallo pendiente'); }
    else if (!s) { score += 2; why.push('no vista'); }
    else if (s.last === 'c' && now - s.lastSeen < recent) { score -= 2.5; why.push('acertada hace poco'); }
    else if (s.dueAt <= now) { score += 1; why.push('repaso espaciado vencido'); }
    if (ti.acc !== null) score += (1 - ti.acc) * 2; // tema flojo
    score += (1 - ti.seenRatio) * 1.5; // tema poco estudiado
    return { qid: q.id, topic: q.topic, score, reason: why.join(', ') || 'equilibrio' };
  }).sort((a, b) => b.score - a.score);

  const maxPerTopic = Math.max(2, Math.ceil(o.count / 6));
  const perTopic = new Map<string, number>();
  const usedFacts = new Set<string>();
  const bank = new Map(pool.map((q) => [q.id, q]));
  const chosen: Question[] = [];
  const pick = (cap: number) => {
    for (const r of ranking) {
      if (chosen.length >= o.count) break;
      const q = bank.get(r.qid)!;
      if (chosen.includes(q)) continue;
      const key = q.fact ?? q.id;
      if (usedFacts.has(key)) continue;
      if ((perTopic.get(q.topic) ?? 0) >= cap) continue;
      usedFacts.add(key);
      perTopic.set(q.topic, (perTopic.get(q.topic) ?? 0) + 1);
      chosen.push(q);
    }
  };
  pick(maxPerTopic);
  if (chosen.length < o.count) pick(Infinity); // si no hay temas suficientes, se relaja el tope
  return { items: shuffle(chosen, rnd).map((q) => makeItem(q, rnd)), ranking };
}
