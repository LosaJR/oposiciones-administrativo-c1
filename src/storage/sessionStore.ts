import { finishSession, updateStats } from '../core/exam';
import type { Attempt, QStat, Question, Session } from '../core/types';

/** Lo mínimo que SessionStore necesita de la base de datos (facilita las pruebas con fallos simulados). */
export interface SessionDb {
  getActive(): Promise<Session | undefined>;
  saveActive(s: Session): Promise<void>;
  clearActive(): Promise<void>;
  addAttempt(a: Attempt): Promise<void>;
  listStats(): Promise<Map<string, QStat>>;
  putStats(list: QStat[]): Promise<void>;
}

/**
 * Sesión activa con escritura SERIALIZADA.
 *
 * Problemas que evita:
 *  - Pérdida de actualizaciones: cada cambio se aplica sobre el último estado en memoria (no sobre la
 *    instantánea de un render), así dos pulsaciones antes de que React vuelva a pintar no se pisan.
 *  - Escrituras fuera de orden: las escrituras a IndexedDB forman una cadena; cada una guarda el estado
 *    más reciente en el momento de ejecutarse, de modo que lo último escrito es siempre lo último elegido.
 *  - Entregar justo después de marcar: `finish` espera a la cadena y usa el estado en memoria.
 */
export class SessionStore {
  private cur: Session | null = null;
  private chain: Promise<void> = Promise.resolve();
  private lastError: unknown = null;
  private done = new Set<string>();

  constructor(private db: SessionDb) {}

  get current(): Session | null { return this.cur; }
  get writeError(): unknown { return this.lastError; }

  async load(): Promise<Session | null> {
    await this.chain;
    this.cur = (await this.db.getActive()) ?? null;
    return this.cur;
  }

  /** Empieza (o reemplaza) la sesión activa. */
  start(s: Session): void {
    this.cur = s;
    this.enqueue();
  }

  /** Aplica un cambio sobre el último estado. Devuelve null si ya no hay sesión (p. ej. tras entregar). */
  update(fn: (s: Session) => Session): Session | null {
    if (!this.cur) return null;
    this.cur = fn(this.cur);
    this.enqueue();
    return this.cur;
  }

  /** Espera a que todas las escrituras pendientes terminen (o fallen: el fallo queda en writeError). */
  flush(): Promise<void> {
    return this.chain;
  }

  private enqueue(): void {
    this.chain = this.chain.then(async () => {
      try {
        const s = this.cur;
        if (s) await this.db.saveActive(s);
        else await this.db.clearActive();
        this.lastError = null;
      } catch (e) {
        // Se conserva el estado en memoria; la siguiente escritura lo reintenta.
        this.lastError = e;
      }
    });
  }

  async discard(): Promise<void> {
    this.cur = null;
    this.enqueue();
    await this.flush();
  }

  /** Entrega: espera a las escrituras, puntúa el estado más reciente, guarda el intento y limpia la sesión. */
  async finish(bank: Map<string, Question>, timedOut = false, now = Date.now()): Promise<Attempt | null> {
    await this.flush();
    const s = this.cur;
    if (!s || this.done.has(s.id)) return null;
    this.done.add(s.id);
    const att = finishSession(s, bank, now, timedOut);
    await this.db.addAttempt(att);
    const stats = await this.db.listStats();
    await this.db.putStats(updateStats(stats, att, bank));
    this.cur = null; // a partir de aquí ningún update() puede resucitar la sesión
    this.enqueue();
    await this.flush();
    return att;
  }
}
