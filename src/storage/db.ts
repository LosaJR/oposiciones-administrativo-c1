import type { Attempt, QStat, Session, Settings } from '../core/types';

export const SCHEMA_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  includePending: false,
  theme: 'auto',
  avoidRecent: true,
  profile: 'general',
  practiceFeedback: true,
};

type StoreName = 'kv' | 'attempts' | 'qstats';

/** Migraciones versionadas: la posicion i migra de la version i a i+1. */
const MIGRATIONS: ((db: IDBDatabase, tx: IDBTransaction) => void)[] = [
  (db) => {
    db.createObjectStore('kv');
    db.createObjectStore('attempts', { keyPath: 'id' });
    db.createObjectStore('qstats', { keyPath: 'qid' });
  },
];

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => {
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export class Db {
  private constructor(private idb: IDBDatabase | null, private mem: Record<StoreName, Map<IDBValidKey, unknown>>, readonly name: string) {}

  static async open(name: string): Promise<Db> {
    const mem = { kv: new Map(), attempts: new Map(), qstats: new Map() } as Record<StoreName, Map<IDBValidKey, unknown>>;
    if (typeof indexedDB === 'undefined') return new Db(null, mem, name);
    try {
      const idb = await new Promise<IDBDatabase>((res, rej) => {
        const r = indexedDB.open(name, MIGRATIONS.length);
        r.onupgradeneeded = (ev) => {
          for (let v = ev.oldVersion; v < MIGRATIONS.length; v++) MIGRATIONS[v](r.result, r.transaction!);
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
        r.onblocked = () => rej(new Error('IndexedDB bloqueada'));
      });
      return new Db(idb, mem, name);
    } catch {
      return new Db(null, mem, name);
    }
  }

  get persistent(): boolean { return this.idb !== null; }

  private async get<T>(s: StoreName, key: IDBValidKey): Promise<T | undefined> {
    if (!this.idb) return this.mem[s].get(key) as T | undefined;
    return req(this.idb.transaction(s).objectStore(s).get(key)) as Promise<T | undefined>;
  }
  private async put(s: StoreName, value: unknown, key?: IDBValidKey): Promise<void> {
    if (!this.idb) {
      const k = key ?? (value as { id?: string; qid?: string }).id ?? (value as { qid?: string }).qid!;
      this.mem[s].set(k, value);
      return;
    }
    await req(this.idb.transaction(s, 'readwrite').objectStore(s).put(value, key));
  }
  private async del(s: StoreName, key: IDBValidKey): Promise<void> {
    if (!this.idb) { this.mem[s].delete(key); return; }
    await req(this.idb.transaction(s, 'readwrite').objectStore(s).delete(key));
  }
  private async all<T>(s: StoreName): Promise<T[]> {
    if (!this.idb) return [...this.mem[s].values()] as T[];
    return req(this.idb.transaction(s).objectStore(s).getAll()) as Promise<T[]>;
  }

  async getSettings(): Promise<Settings> {
    const s = await this.get<Partial<Settings>>('kv', 'settings');
    return { ...DEFAULT_SETTINGS, ...(s ?? {}) };
  }
  saveSettings(s: Settings): Promise<void> { return this.put('kv', s, 'settings'); }

  getActive(): Promise<Session | undefined> { return this.get<Session>('kv', 'active'); }
  saveActive(s: Session): Promise<void> { return this.put('kv', s, 'active'); }
  clearActive(): Promise<void> { return this.del('kv', 'active'); }

  async addAttempt(a: Attempt): Promise<void> { await this.put('attempts', a); }
  async listAttempts(): Promise<Attempt[]> {
    return (await this.all<Attempt>('attempts')).sort((x, y) => y.finishedAt - x.finishedAt);
  }
  getAttempt(id: string): Promise<Attempt | undefined> { return this.get<Attempt>('attempts', id); }

  async listStats(): Promise<Map<string, QStat>> {
    return new Map((await this.all<QStat>('qstats')).map((s) => [s.qid, s]));
  }
  async putStats(list: QStat[]): Promise<void> { for (const s of list) await this.put('qstats', s); }

  async getMeta<T>(key: string): Promise<T | undefined> { return this.get<T>('kv', `meta:${key}`); }
  async setMeta(key: string, v: unknown): Promise<void> { return this.put('kv', v, `meta:${key}`); }

  async clearAll(): Promise<void> {
    for (const s of ['kv', 'attempts', 'qstats'] as StoreName[]) {
      if (!this.idb) this.mem[s].clear();
      else await req(this.idb.transaction(s, 'readwrite').objectStore(s).clear());
    }
  }

  async exportAll(env: string): Promise<BackupFile> {
    return {
      app: 'agec1', schema: SCHEMA_VERSION, env, exportedAt: new Date().toISOString(),
      settings: await this.getSettings(), attempts: await this.listAttempts(), qstats: [...(await this.listStats()).values()],
    };
  }

  async importAll(file: unknown, mode: 'merge' | 'replace'): Promise<{ attempts: number; qstats: number }> {
    const f = validateBackup(file);
    if (mode === 'replace') await this.clearAll();
    for (const a of f.attempts) await this.put('attempts', a);
    const cur = await this.listStats();
    for (const s of f.qstats) {
      const c = cur.get(s.qid);
      if (!c || s.lastSeen >= c.lastSeen) await this.put('qstats', s);
    }
    if (mode === 'replace') await this.saveSettings({ ...DEFAULT_SETTINGS, ...f.settings });
    return { attempts: f.attempts.length, qstats: f.qstats.length };
  }

  close(): void { this.idb?.close(); }
}

export interface BackupFile {
  app: 'agec1'; schema: number; env: string; exportedAt: string;
  settings: Settings; attempts: Attempt[]; qstats: QStat[];
}

export function validateBackup(x: unknown): BackupFile {
  const f = x as Partial<BackupFile> | null;
  if (!f || typeof f !== 'object' || f.app !== 'agec1') throw new Error('El archivo no es una copia de AGE C1.');
  if (typeof f.schema !== 'number' || f.schema > SCHEMA_VERSION) throw new Error('La copia procede de una versión más nueva de la aplicación.');
  if (!Array.isArray(f.attempts) || !Array.isArray(f.qstats)) throw new Error('Copia incompleta: faltan intentos o estadísticas.');
  for (const a of f.attempts) {
    if (!a || typeof a.id !== 'string' || typeof a.finishedAt !== 'number' || !a.result) throw new Error('Intento con formato inválido.');
  }
  for (const s of f.qstats) {
    if (!s || typeof s.qid !== 'string' || typeof s.lastSeen !== 'number') throw new Error('Estadística con formato inválido.');
  }
  return { ...f, settings: f.settings ?? DEFAULT_SETTINGS } as BackupFile;
}

export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch { /* sin soporte */ }
  return false;
}
