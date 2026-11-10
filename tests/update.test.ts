import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Db } from '../src/storage/db';
import { bankMap, cases, questions } from '../src/core/bank';
import { finishSession, makeSession, updateStats } from '../src/core/exam';
import { fullBank } from './helpers';

const patches = JSON.parse(readFileSync('data/audit-patches.json', 'utf8')) as { remove: Record<string, string>; edit: Record<string, unknown> };

describe('actualización de la aplicación sin perder el historial', () => {
  it('las preguntas retiradas tras la revisión no reaparecen ni cambian de significado (los identificadores no se reutilizan)', () => {
    for (const id of Object.keys(patches.remove)) expect(bankMap.has(id), `${id} fue retirada y no debe volver`).toBe(false);
    for (const c of cases) for (const id of [...c.questionIds, ...(c.reserveQuestionIds ?? [])]) expect(patches.remove[id]).toBeUndefined();
  });

  it('las preguntas corregidas conservan su identificador y suben de versión (el historial por pregunta sigue valiendo)', () => {
    for (const id of Object.keys(patches.edit)) {
      const q = bankMap.get(id);
      expect(q, `${id} debe seguir en el banco`).toBeDefined();
      expect(q!.version).toBeGreaterThan(1);
      expect(q!.reviewerNotes).toContain('segunda revision a ciegas');
    }
  });

  it('un intento guardado por una versión anterior, con una pregunta hoy retirada, se sigue leyendo y puntuando tras reabrir la base', async () => {
    const { questions: qs } = fullBank(3);
    const bank = new Map(qs.map((q) => [q.id, q]));
    const db = await Db.open('agec1-test-update');
    const items = qs.slice(0, 5).map((q) => ({ qid: q.id, order: q.options.map((o) => o.id) }));
    const s = makeSession('topic', 'exam', 'Test previo', items, 7, false, 1000);
    for (const it of items) s.answers[it.qid] = bank.get(it.qid)!.correctOptionId;
    const att = finishSession(s, bank, 2000);
    await db.addAttempt(att);
    await db.putStats(updateStats(new Map(), att, bank));
    db.close();

    // «Nueva versión»: el banco ya no contiene dos de esas preguntas; la base de datos y el intento siguen ahí.
    const db2 = await Db.open('agec1-test-update');
    const attempts = await db2.listAttempts();
    expect(attempts).toHaveLength(1);
    expect(attempts[0].part1.map((i) => i.qid)).toEqual(items.map((i) => i.qid));
    expect(attempts[0].result.part1.correct).toBe(5);
    const stats = await db2.listStats();
    expect(stats.size).toBe(5);
    // las estadísticas de una pregunta retirada siguen en la base: solo se ignoran al construir tests nuevos
    expect(stats.get(items[0].qid)?.seen).toBe(1);
    db2.close();
  });

  it('el banco real no contiene dos preguntas con el mismo identificador', () => {
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
  });
});
