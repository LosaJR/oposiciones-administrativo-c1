// Comprueba que responden los enlaces de fuente del banco (BOE y paginas oficiales). Necesita red.
// Uso: node scripts/check-links.mjs   -> sale con 1 si algun enlace esta roto (404/410/5xx o sin respuesta).
// Los 401/403/429 se muestran como aviso: algunos sitios bloquean a los clientes automaticos y eso no prueba que el enlace este roto.
import { readFileSync, readdirSync } from 'node:fs';

const urls = new Map(); // url -> origen
const add = (u, from) => { if (typeof u === 'string' && /^https?:\/\//.test(u) && !urls.has(u)) urls.set(u, from); };

const sources = JSON.parse(readFileSync('data/sources.json', 'utf8'));
for (const [k, v] of Object.entries(sources)) {
  if (v?.url) add(v.url, `sources.json:${k}`);
  if (v?.id && /^BOE-/.test(v.id)) add(`https://www.boe.es/buscar/act.php?id=${v.id}`, `sources.json:${k}`);
}
for (const f of readdirSync('data/questions').filter((x) => x.startsWith('bank-'))) {
  for (const q of JSON.parse(readFileSync(`data/questions/${f}`, 'utf8'))) {
    if (q.reviewStatus !== 'audited_current') continue;
    add(q.source?.url?.split('#')[0], q.id);
  }
}
for (const c of JSON.parse(readFileSync('data/cases.json', 'utf8'))) for (const u of c.sources ?? []) add(u, c.id);

const list = [...urls];
let broken = 0, warn = 0, done = 0;
const check = async ([u, from]) => {
  for (const method of ['HEAD', 'GET']) {
    try {
      const r = await fetch(u, { method, redirect: 'follow', headers: { 'User-Agent': 'agec1-link-check/1.0' }, signal: AbortSignal.timeout(20000) });
      if (r.status < 400) return;
      if ([401, 403, 429].includes(r.status)) { warn++; console.log(`AVISO ${r.status} ${u} (${from})`); return; }
      if (method === 'GET') { broken++; console.log(`ROTO ${r.status} ${u} (${from})`); return; }
    } catch (e) {
      if (method === 'GET') { broken++; console.log(`ROTO sin respuesta ${u} (${from}): ${e.message}`); return; }
    }
  }
};
const queue = [...list];
await Promise.all(Array.from({ length: 6 }, async () => { for (let it = queue.shift(); it; it = queue.shift()) { await check(it); done++; } }));
console.log(`${list.length} enlaces distintos; rotos: ${broken}; avisos: ${warn}`);
process.exit(broken ? 1 : 0);
