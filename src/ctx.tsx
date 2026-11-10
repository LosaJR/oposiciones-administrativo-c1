import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Db, DEFAULT_SETTINGS } from './storage/db';
import { SessionStore } from './storage/sessionStore';
import { ENV, bankMap, cases, profile, questions, topics } from './core/bank';
import { coverageReport, isAllowed } from './core/exam';
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
  /** Empieza una sesión nueva y espera a que quede guardada. */
  saveActive: (s: Session) => Promise<void>;
  /** Aplica un cambio sobre el ÚLTIMO estado de la sesión (nunca sobre una instantánea de render). */
  updateActive: (fn: (s: Session) => Session) => void;
  /** Cierra la sesion, guarda el intento y actualiza estadisticas. Devuelve el intento. */
  finish: (timedOut?: boolean) => Promise<Attempt | null>;
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
  const storeRef = useRef<SessionStore | null>(null);

  const reload = useCallback(async () => {
    const d = dbRef.current;
    if (!d) return;
    setS(await d.getSettings());
    setStats(await d.listStats());
    setAttempts(await d.listAttempts());
    setActive(storeRef.current?.current ?? null);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const d = await Db.open(`agec1-${ENV}`);
      if (!alive) return;
      dbRef.current = d;
      storeRef.current = new SessionStore(d);
      await storeRef.current.load();
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
    const st = storeRef.current!;
    st.start(s);
    setActive(s);
    await st.flush();
  }, []);

  const updateActive = useCallback((fn: (s: Session) => Session) => {
    const n = storeRef.current?.update(fn) ?? null;
    setActive(n);
  }, []);

  const finish = useCallback(async (timedOut = false) => {
    const att = await storeRef.current!.finish(bankMap, timedOut);
    setActive(null);
    await reload();
    return att;
  }, [reload]);

  const discardActive = useCallback(async () => {
    await storeRef.current!.discard();
    setActive(null);
  }, []);

  // Mejor esfuerzo al ocultar o cerrar la pestaña: dejar terminar la cola de escritura.
  useEffect(() => {
    const flush = () => { void storeRef.current?.flush(); };
    const vis = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pagehide', flush);
    return () => { document.removeEventListener('visibilitychange', vis); window.removeEventListener('pagehide', flush); };
  }, []);

  const pool = useMemo(() => questions.filter((q) => isAllowed(q, includePending)), [includePending]);
  const coverage = useMemo(() => coverageReport(questions, cases, topics, includePending, profile), [includePending]);
  const pwa = usePwa(active !== null);

  const value: AppCtx = {
    ready, db, persistent: db?.persistent ?? false, settings, setSettings, stats, attempts, active, saveActive, updateActive, finish, discardActive, reload,
    includePending, pool, coverage, pwa,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
