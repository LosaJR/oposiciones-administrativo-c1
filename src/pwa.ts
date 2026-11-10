import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { APP_VERSION } from './core/bank';

export interface PwaState {
  /** hay una version nueva lista */
  updateReady: boolean;
  /** se puede aplicar ya (no hay un examen en curso) */
  canApply: boolean;
  apply: () => void;
  offlineReady: boolean;
  checkNow: () => Promise<'new' | 'same' | 'error'>;
}

/**
 * Deteccion de version: (1) service worker en modo "prompt", (2) sondeo de version.json con el SHA del commit.
 * Nunca se recarga solo: si hay un examen en curso se espera a que termine.
 */
export function usePwa(examInProgress: boolean): PwaState {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [remoteNew, setRemoteNew] = useState(false);
  const updateSW = useRef<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    updateSW.current = registerSW({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
    });
  }, []);

  const checkNow = useCallback(async (): Promise<'new' | 'same' | 'error'> => {
    try {
      const r = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) return 'error';
      const j = (await r.json()) as { version?: string };
      if (j.version && APP_VERSION !== 'dev' && j.version !== APP_VERSION) { setRemoteNew(true); return 'new'; }
      return 'same';
    } catch {
      return 'error';
    }
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    void checkNow();
    const onVis = () => { if (document.visibilityState === 'visible') void checkNow(); };
    document.addEventListener('visibilitychange', onVis);
    const id = window.setInterval(() => void checkNow(), 10 * 60 * 1000);
    return () => { document.removeEventListener('visibilitychange', onVis); window.clearInterval(id); };
  }, [checkNow]);

  const apply = useCallback(() => {
    if (examInProgress) return;
    if (updateSW.current && needRefresh) void updateSW.current(true);
    else window.location.reload();
  }, [examInProgress, needRefresh]);

  return { updateReady: needRefresh || remoteNew, canApply: !examInProgress, apply, offlineReady, checkNow };
}
