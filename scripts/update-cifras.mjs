// Regenera el bloque de cifras de docs/ESTADO.md a partir de los datos (entre las marcas CIFRAS:START y CIFRAS:END).
// Evita que el estado diga una cosa y el banco otra. Uso: node scripts/update-cifras.mjs [--check]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

export function calcular(base = '.') {
  const qs = [];
  for (const f of readdirSync(`${base}/data/questions`).filter((n) => /^bank-.*\.json$/.test(n))) {
    qs.push(...JSON.parse(readFileSync(`${base}/data/questions/${f}`, 'utf8')));
  }
  const ok = qs.filter((q) => q.reviewStatus === 'audited_current');
  const cases = JSON.parse(readFileSync(`${base}/data/cases.json`, 'utf8'));
  const porTema = {};
  for (const q of ok) if (q.kind !== 'practical') porTema[q.topic] = (porTema[q.topic] ?? 0) + 1;
  const ordenados = Object.fromEntries(Object.entries(porTema).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })));
  const casos = cases.filter((c) => c.reviewStatus === 'audited_current');
  return {
    auditadas: ok.length,
    teoria: ok.filter((q) => q.kind === 'theory').length,
    ofimatica: ok.filter((q) => q.kind === 'office').length,
    enSupuestos: ok.filter((q) => q.kind === 'practical').length,
    supuestos: casos.length,
    temas: Object.keys(ordenados).length,
    minimoPorTema: Math.min(...Object.values(ordenados)),
    porTema: ordenados,
  };
}

export function bloque(c) {
  const bl = {};
  for (const [t, n] of Object.entries(c.porTema)) (bl[t.split('-')[0]] ??= []).push(`${t} ${n}`);
  const filas = Object.entries(bl).map(([b, v]) => `| ${b === 'VI' ? 'Bloque VI (ofimática)' : 'Bloque ' + b} | ${v.join(' · ')} |`);
  return [
    '<!-- CIFRAS:START (generado por scripts/update-cifras.mjs; no editar a mano) -->',
    `- Preguntas auditadas: **${c.auditadas}** (${c.teoria} de teoría, ${c.ofimatica} de ofimática, ${c.enSupuestos} de supuestos).`,
    `- Supuestos completos (20 preguntas + 5 reservas): **${c.supuestos}**.`,
    `- Temas con al menos una pregunta auditada de teoría u ofimática: **${c.temas}/45**; mínimo por tema: **${c.minimoPorTema}**.`,
    '',
    '| Bloque | Preguntas auditadas de teoría u ofimática por tema |',
    '|---|---|',
    ...filas,
    `<!-- CIFRAS:JSON ${JSON.stringify({ auditadas: c.auditadas, teoria: c.teoria, ofimatica: c.ofimatica, enSupuestos: c.enSupuestos, supuestos: c.supuestos, temas: c.temas, minimoPorTema: c.minimoPorTema })} -->`,
    '<!-- CIFRAS:END -->',
  ].join('\n');
}

if (process.argv[1] && process.argv[1].endsWith('update-cifras.mjs')) {
  const path = 'docs/ESTADO.md';
  const md = readFileSync(path, 'utf8');
  const re = /<!-- CIFRAS:START[\s\S]*?<!-- CIFRAS:END -->/;
  if (!re.test(md)) { console.error('Faltan las marcas CIFRAS:START / CIFRAS:END en docs/ESTADO.md'); process.exit(2); }
  const nuevo = md.replace(re, bloque(calcular()));
  if (process.argv.includes('--check')) { if (nuevo !== md) { console.error('docs/ESTADO.md tiene cifras antiguas: ejecuta node scripts/update-cifras.mjs'); process.exit(1); } console.log('Cifras de ESTADO.md al día.'); }
  else { writeFileSync(path, nuevo); console.log('Cifras de ESTADO.md actualizadas.'); }
}
