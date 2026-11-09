import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Db, DEFAULT_SETTINGS } from './storage/db';
import { ENV, bankMap, cases, profile, questions, topics } from './core/bank';
import { coverageReport, finishSession, isAllowed, updateStats } from './core/exam';
import type { Attempt, QStat, Session, Settings } from './core/types';
import { usePwa, type PwaState } from './pwa';

interface AppCtx {
  ready: boolean;
  db: Db | null;
  persistent: boolean;
  settings: Settings;
  setSettings: (s: Partial<Settings>) => Promise<void>;
  stats: Map<string, QStat>;
  attempts: Attempt[];
  active: Session | null;
  saveActive: (s: Session) => Promise<void>;
  /** Cierra la sesion, guarda el intento y actualiza estadisticas. Devuelve el intento. */
  finish: (s: Session, timedOut?: boolean) => Promise<Attempt>;
  discardActive: () => Promise<void>;
  reload: () => Promise<void>;
  includePending: boolean;
  pool: typeof questions;
  coverage: ReturnType<typeof coverageReport>;
  pwa: PwaState;
}

const Ctx = createContext<AppCtx | null>(null);
export const useApp = (): AppCtx => {
  const c = useContext(Ctx);
  if (!c) throw new Error('AppProvider ausente');
  return c;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Db | null>(null);
  const [settings, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<Map<string, QStat>>(new Map());
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [active, setActive] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const dbRef = useRef<Db | null>(null);

  const reload = useCallback(async () => {
    const d = dbRef.current;
    if (!d) return;
    setS(await d.getSettings());
    setStats(await d.listStats());
    setAttempts(await d.listAttempts());
    setActive((await d.getActive()) ?? null);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const d = await Db.open(`agec1-${ENV}`);
      if (!alive) return;
      dbRef.current = d;
      setDb(d);
      await reload();
      setReady(true);
    })();
    return () => { alive = false; };
  }, [reload]);

  // En produccion nunca se admiten preguntas pendientes, aunque quedara un ajuste guardado.
  const includePending = ENV === 'lab' && settings.includePending;

  useEffect(() => {
    const t = settings.theme;
    document.documentElement.setAttribute('data-theme', t);
  }, [settings.theme]);

  const setSettings = useCallback(async (p: Partial<Settings>) => {
    const d = dbRef.current!;
    const next = { ...(await d.getSettings()), ...p };
    await d.saveSettings(next);
    setS(next);
  }, []);

  const saveActive = useCallback(async (s: Session) => {
    setActive(s);
    await dbRef.current!.saveActive(s);
  }, []);

  const finish = useCallback(async (s: Session, timedOut = false) => {
    const d = dbRef.current!;
    const att = finishSession(s, bankMap, Date.now(), timedOut);
    await d.addAttempt(att);
    const cur = await d.listStats();
    await d.putStats(updateStats(cur, att, bankMap));
    await d.clearActive();
    await reload();
    return att;
  }, [reload]);

  const discardActive = useCallback(async () => {
    await dbRef.current!.clearActive();
    setActive(null);
  }, []);

  const pool = useMemo(() => questions.filter((q) => isAllowed(q, includePending)), [includePending]);
  const coverage = useMemo(() => coverageReport(questions, cases, topics, includePending, profile), [includePending]);
  const pwa = usePwa(active !== null);

  const value: AppCtx = {
    ready, db, persistent: db?.persistent ?? false, settings, setSettings, stats, attempts, active, saveActive, finish, discardActive, reload,
    includePending, pool, coverage, pwa,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
