/** Semilla de 32 bits procedente de crypto cuando existe. */
export function randomSeed(): number {
  const g = globalThis as { crypto?: { getRandomValues<T extends ArrayBufferView>(a: T): T } };
  if (g.crypto?.getRandomValues) {
    const a = new Uint32Array(1);
    g.crypto.getRandomValues(a);
    return a[0];
  }
  return Math.floor(Math.random() * 2 ** 32) >>> 0;
}

/** mulberry32: PRNG determinista (misma semilla, mismo examen; permite repetir un intento). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rnd: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
