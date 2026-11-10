import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cases, questions } from '../src/core/bank';

const estado = readFileSync('docs/ESTADO.md', 'utf8');
const calidad = readFileSync('docs/CALIDAD.md', 'utf8');
const roadmap = readFileSync('docs/ROADMAP.md', 'utf8');

describe('la documentación coincide con el banco real', () => {
  const m = /<!-- CIFRAS:JSON (\{.*?\}) -->/.exec(estado);
  it('ESTADO.md lleva el bloque de cifras generado', () => {
    expect(m, 'ejecuta node scripts/update-cifras.mjs').not.toBeNull();
  });

  it('las cifras de ESTADO.md son las del banco (si no, ejecuta node scripts/update-cifras.mjs)', () => {
    const doc = JSON.parse(m![1]);
    const ok = questions.filter((q) => q.reviewStatus === 'audited_current');
    const porTema = new Map<string, number>();
    for (const q of ok) if (q.kind !== 'practical') porTema.set(q.topic, (porTema.get(q.topic) ?? 0) + 1);
    expect(doc.auditadas).toBe(ok.length);
    expect(doc.teoria).toBe(ok.filter((q) => q.kind === 'theory').length);
    expect(doc.ofimatica).toBe(ok.filter((q) => q.kind === 'office').length);
    expect(doc.enSupuestos).toBe(ok.filter((q) => q.kind === 'practical').length);
    expect(doc.supuestos).toBe(cases.filter((c) => c.reviewStatus === 'audited_current').length);
    expect(doc.temas).toBe(porTema.size);
    expect(doc.minimoPorTema).toBe(Math.min(...porTema.values()));
    // la tabla por tema también debe ser la real
    for (const [t, n] of porTema) expect(estado, `${t} ${n}`).toContain(`${t} ${n}`);
  });

  it('no quedan cifras ni afirmaciones antiguas (804 preguntas, «objetivo no alcanzado», 1.006 como total vigente)', () => {
    for (const [nombre, texto] of [['ESTADO', estado], ['CALIDAD', calidad], ['ROADMAP', roadmap]] as const) {
      expect(texto, `${nombre} menciona 804`).not.toMatch(/\b804\b/);
      expect(texto, `${nombre} dice que el objetivo no se alcanzó`).not.toMatch(/no se ha alcanzado/i);
    }
  });

  it('el recuento de las dos evaluaciones citado en CALIDAD y AUDITORIA existe como registro de datos', () => {
    const r = JSON.parse(readFileSync('audit/resultados.json', 'utf8'));
    expect(r.resumen.muestra.revisadas).toBeGreaterThanOrEqual(100);
    expect(r.resumen.supuestos.revisadas).toBe(250);
    expect(readFileSync('docs/AUDITORIA.md', 'utf8')).toContain(String(r.resumen.muestra.revisadas));
  });
});
