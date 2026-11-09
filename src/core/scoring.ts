import type { Answers, ExamItem, PartResult, Question } from './types';

/** Todas las puntuaciones se manejan en TERCIOS enteros: 3*aciertos - errores. */
export function thirds(correct: number, wrong: number): number {
  return 3 * correct - wrong;
}

export function formatDirect(th: number): string {
  const v = Math.round((th / 3) * 100) / 100;
  return v.toFixed(2).replace('.', ',');
}

export function scorePart(items: ExamItem[], answers: Answers, bank: Map<string, Question>): PartResult {
  let correct = 0, wrong = 0, blank = 0;
  for (const it of items) {
    const q = bank.get(it.qid);
    const a = answers[it.qid] ?? null;
    if (a === null) blank++;
    else if (q && a === q.correctOptionId) correct++;
    else wrong++;
  }
  return { correct, wrong, blank, total: items.length, thirds: thirds(correct, wrong) };
}

export type PartVerdict = 'pass' | 'fail' | 'unknown' | 'not_evaluated';

export function verdictPart(th: number, minThirds: number | null): PartVerdict {
  if (minThirds === null) return 'unknown';
  return th >= minThirds ? 'pass' : 'fail';
}

export interface ExamVerdict {
  part1: PartVerdict;
  part2: PartVerdict;
  global: 'pass' | 'fail' | 'unknown';
}

/** Doble eliminatoria: la parte 2 solo se evalua si la 1 se supera. */
export function verdictExam(p1: number, p2: number | null, min1: number | null, min2: number | null): ExamVerdict {
  const v1 = verdictPart(p1, min1);
  if (v1 === 'fail') return { part1: 'fail', part2: 'not_evaluated', global: 'fail' };
  if (p2 === null) return { part1: v1, part2: 'unknown', global: 'unknown' };
  const v2 = verdictPart(p2, min2);
  const global = v1 === 'pass' && v2 === 'pass' ? 'pass' : v2 === 'fail' ? 'fail' : 'unknown';
  return { part1: v1, part2: v2, global };
}

/** Estimacion lineal 0-50 (M->25, N->50). NO es la formula oficial: solo entrenamiento. */
export function estimateScore(th: number, minThirds: number, maxThirds: number): number {
  const v = th >= minThirds
    ? 25 + (25 * (th - minThirds)) / (maxThirds - minThirds)
    : (25 * Math.max(th, 0)) / minThirds;
  return Math.round(v * 10) / 10;
}
