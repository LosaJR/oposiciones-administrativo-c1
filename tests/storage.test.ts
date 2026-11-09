import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { Db, SCHEMA_VERSION, validateBackup } from '../src/storage/db';
import { buildTopicItems, finishSession, makeSession, updateStats } from '../src/core/exam';
import { fullBank } from './helpers';

describe('persistencia IndexedDB (modo sin conexion)', () => {
  it('conserva la sesion activa, intentos y estadisticas tras cerrar y reabrir', async () => {
    const { questions } = fullBank(3);
    const bank = new Map(questions.map((q) => [q.id, q]));
    const db = await Db.open('agec1-test-1');
    expect(db.persistent).toBe(true);
    const items = buildTopicItems(questions, { topics: ['I-01'], count: 3, includePending: false, seed: 4 }).items;
    const s = makeSession('topic', 'exam', 'Test I-01', items, 4, false, 1000);
    s.answers[items[0].qid] = 'o0';
    await db.saveActive(s);
    const att = finishSession(s, bank, 2000);
    await db.addAttempt(att);
    await db.putStats(updateStats(new Map(), att, bank));
    db.close();

    const db2 = await Db.open('agec1-test-1');
    expect((await db2.getActive())!.answers[items[0].qid]).toBe('o0');
    expect(await db2.listAttempts()).toHaveLength(1);
    expect((await db2.listStats()).size).toBe(3);
    await db2.clearActive();
    expect(await db2.getActive()).toBeUndefined();
  });

  it('entornos distintos usan bases distintas (lab no toca prod)', async () => {
    const prod = await Db.open('agec1-prod-x');
    const lab = await Db.open('agec1-lab-x');
    await prod.setMeta('k', 1);
    expect(await lab.getMeta('k')).toBeUndefined();
  });

  it('exporta e importa (fusion y reemplazo) y rechaza copias ajenas o de version futura', async () => {
    const { questions } = fullBank(3);
    const bank = new Map(questions.map((q) => [q.id, q]));
    const a = await Db.open('agec1-test-a');
    const items = buildTopicItems(questions, { topics: ['II-01'], count: 3, includePending: false, seed: 9 }).items;
    const att = finishSession(makeSession('topic', 'exam', 'x', items, 9, false, 5), bank, 6);
    await a.addAttempt(att);
    await a.putStats(updateStats(new Map(), att, bank));
    const backup = JSON.parse(JSON.stringify(await a.exportAll('lab')));
    const b = await Db.open('agec1-test-b');
    expect(await b.importAll(backup, 'merge')).toEqual({ attempts: 1, qstats: 3 });
    expect(await b.listAttempts()).toHaveLength(1);
    await b.importAll(backup, 'replace');
    expect(await b.listAttempts()).toHaveLength(1);
    expect(() => validateBackup({ app: 'otra' })).toThrow();
    expect(() => validateBackup({ ...backup, schema: SCHEMA_VERSION + 1 })).toThrow(/más nueva/);
    expect(() => validateBackup({ ...backup, attempts: [{ id: 1 }] })).toThrow();
  });
});
