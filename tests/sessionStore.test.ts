import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { Db } from '../src/storage/db';
import { SessionStore, type SessionDb } from '../src/storage/sessionStore';
import { buildTopicItems, makeSession } from '../src/core/exam';
import { remainingMs } from '../src/core/exam';
import type { Session } from '../src/core/types';
import { fullBank } from './helpers';

const { questions } = fullBank(10);
const bank = new Map(questions.map((q) => [q.id, q]));
const items = () => buildTopicItems(questions, { topics: ['I-01'], count: 10, includePending: false, seed: 5 }).items;
const sess = (): Session => makeSession('topic', 'exam', 'Test', items(), 5, false, 1000);
const answer = (qid: string, v: string | null) => (s: Session): Session => ({ ...s, answers: { ...s.answers, [qid]: v } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('guardado serializado de la sesión', () => {
  it('200 cambios sin esperar entre ellos no se pisan: lo guardado es el último estado', async () => {
    const db = await Db.open('agec1-ss-1');
    const st = new SessionStore(db);
    const s = sess();
    st.start(s);
    const ids = s.part1.map((i) => i.qid);
    for (let i = 0; i < 200; i++) st.update(answer(ids[i % ids.length], `o${i % 4}`)); // pulsaciones rápidas, sin await
    st.update((cur) => ({ ...cur, cursor: 7 }));
    await st.flush();
    const saved = (await db.getActive())!;
    expect(saved.cursor).toBe(7);
    expect(saved.answers).toEqual(st.current!.answers);
    // la última respuesta de cada pregunta es la de la última vuelta (i = 190..199)
    expect(saved.answers[ids[9]]).toBe('o' + (199 % 4));
  });

  it('las escrituras se aplican en orden aunque la base tarde tiempos distintos', async () => {
    const writes: number[] = [];
    let n = 0;
    const slow: SessionDb = {
      getActive: async () => undefined,
      saveActive: async (s) => { const delay = (n++ % 3) * 15; await sleep(delay); writes.push(s.cursor); },
      clearActive: async () => {}, addAttempt: async () => {}, listStats: async () => new Map(), putStats: async () => {},
    };
    const st = new SessionStore(slow);
    st.start(sess());
    for (let c = 1; c <= 9; c++) st.update((cur) => ({ ...cur, cursor: c }));
    await st.flush();
    expect(writes).toEqual([...writes].sort((a, b) => a - b)); // nunca se escribe un estado más antiguo después de uno más nuevo
    expect(writes[writes.length - 1]).toBe(9);
  });

  it('entregar justo después de marcar incluye la última respuesta', async () => {
    const db = await Db.open('agec1-ss-2');
    const st = new SessionStore(db);
    const s = sess();
    st.start(s);
    const q = s.part1[0].qid;
    st.update(answer(q, bank.get(q)!.correctOptionId));
    const att = await st.finish(bank); // sin esperar a flush antes
    expect(att!.result.part1.correct).toBe(1);
    expect(await db.getActive()).toBeUndefined();
    expect(await db.listAttempts()).toHaveLength(1);
  });

  it('tras entregar, una pulsación tardía no resucita la sesión ni duplica el intento', async () => {
    const db = await Db.open('agec1-ss-3');
    const st = new SessionStore(db);
    const s = sess();
    st.start(s);
    st.update(answer(s.part1[0].qid, 'o0'));
    const first = st.finish(bank);
    const second = st.finish(bank); // doble pulsación en «Entregar»
    st.update(answer(s.part1[1].qid, 'o1')); // clic tardío
    const [a, b] = await Promise.all([first, second]);
    expect(a).not.toBeNull();
    expect(b).toBeNull();
    expect(await db.getActive()).toBeUndefined();
    expect(await db.listAttempts()).toHaveLength(1);
  });

  it('cierre de pestaña y recuperación: una sesión reabierta conserva respuestas, dudas, supuesto y posición', async () => {
    const db = await Db.open('agec1-ss-4');
    const st = new SessionStore(db);
    const s = sess();
    st.start(s);
    st.update(answer(s.part1[2].qid, 'o3'));
    st.update((cur) => ({ ...cur, flags: { [s.part1[4].qid]: true }, cursor: 4, chosenCase: 'CASE-A' }));
    await st.flush();
    db.close(); // la pestaña se cierra
    const db2 = await Db.open('agec1-ss-4');
    const st2 = new SessionStore(db2);
    const back = (await st2.load())!;
    expect(back.answers[s.part1[2].qid]).toBe('o3');
    expect(back.flags[s.part1[4].qid]).toBe(true);
    expect(back.cursor).toBe(4);
    expect(back.chosenCase).toBe('CASE-A');
    expect(back.id).toBe(s.id);
  });

  it('interrupción de la aplicación: si una escritura falla, la memoria conserva el estado y la siguiente lo reintenta', async () => {
    let fail = true;
    const saved: Session[] = [];
    const flaky: SessionDb = {
      getActive: async () => undefined,
      saveActive: async (s) => { if (fail) throw new Error('cuota o interrupción'); saved.push(s); },
      clearActive: async () => {}, addAttempt: async () => {}, listStats: async () => new Map(), putStats: async () => {},
    };
    const st = new SessionStore(flaky);
    const s = sess();
    st.start(s);
    st.update(answer(s.part1[0].qid, 'o1'));
    await st.flush();
    expect(st.writeError).toBeTruthy();
    expect(st.current!.answers[s.part1[0].qid]).toBe('o1');
    fail = false;
    st.update(answer(s.part1[1].qid, 'o2'));
    await st.flush();
    expect(st.writeError).toBeNull();
    expect(saved[saved.length - 1].answers).toEqual({ [s.part1[0].qid]: 'o1', [s.part1[1].qid]: 'o2' });
  });

  it('una sesión con tiempo agotado al reabrir queda con 0 ms restantes', async () => {
    const db = await Db.open('agec1-ss-5');
    const st = new SessionStore(db);
    const s = { ...sess(), endsAt: 5000 };
    st.start(s);
    await st.flush();
    const back = (await new SessionStore(db).load())!;
    expect(remainingMs(back, 10_000)).toBe(0);
  });
});
