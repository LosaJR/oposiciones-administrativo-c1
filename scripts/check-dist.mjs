// Comprueba el contenido de una compilación (dist/) antes de publicarla.
// Producción (por defecto): solo preguntas habilitadas, sin campos internos de auditoría, sin ficheros de trabajo ni datos personales.
// Uso: node scripts/check-dist.mjs [dist] [prod|lab]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = process.argv[2] ?? 'dist';
const modo = process.argv[3] ?? 'prod';
const errores = [];
const err = (m) => errores.push(m);

function listar(d) {
  return readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? listar(p) : [p];
  });
}

const ficheros = listar(dir);
const permitidas = /\.(js|css|html|svg|png|woff2?|webmanifest|json|txt)$/;
for (const f of ficheros) {
  const rel = f.slice(dir.length + 1).replace(/\\/g, '/');
  if (!permitidas.test(rel)) err(`fichero inesperado: ${rel}`);
  if (/(^|\/)(audit|data|docs|scripts|tests|node_modules|\.git)(\/|$)/.test(rel)) err(`carpeta de trabajo en la compilación: ${rel}`);
  if (/\.map$/.test(rel)) err(`mapa de código fuente publicado: ${rel}`);
}

const js = ficheros.filter((f) => f.endsWith('.js') && !/sw\.js$|workbox/.test(f)).map((f) => ({ f, t: readFileSync(f, 'utf8') }));
const todo = js.map((x) => x.t).join('\n');

// Material interno de auditoría y datos personales: nunca en producción.
const prohibidos = ['reviewerNotes', 'claude-source-check', 'sourceHash', 'lawVersionDate', 'retiredReason', 'Corregida tras', 'Distractores reescritos', 'ivaanciio', 'F:\\\\Escritorio', 'C:\\\\Users'];
if (modo === 'prod') {
  for (const m of prohibidos) if (todo.includes(m)) err(`el paquete contiene material interno: «${m}»`);
}

// Recuento de preguntas incluidas: deben ser exactamente las habilitadas.
const m = todo.match(/"?reviewStatus"?:"audited_current"/g);
let esperado = null;
try {
  const base = fileURLToPath(new URL('..', import.meta.url));
  let n = 0;
  for (const f of readdirSync(join(base, 'data/questions')).filter((x) => x.endsWith('.json'))) {
    for (const q of JSON.parse(readFileSync(join(base, 'data/questions', f), 'utf8'))) if (q.reviewStatus === 'audited_current') n++;
  }
  for (const c of JSON.parse(readFileSync(join(base, 'data/cases.json'), 'utf8'))) if (c.reviewStatus === 'audited_current') n++; // los supuestos llevan el mismo campo
  esperado = n;
} catch (e) { console.warn('AVISO: no se pudo contar el banco (' + e.message + ')'); }
// Ninguna pregunta no habilitada (pendiente, retirada o desactualizada) puede viajar en producción.
try {
  const base2 = fileURLToPath(new URL('..', import.meta.url));
  for (const f of readdirSync(join(base2, 'data/questions')).filter((x) => x.endsWith('.json'))) {
    for (const q of JSON.parse(readFileSync(join(base2, 'data/questions', f), 'utf8'))) {
      if (q.reviewStatus !== 'audited_current' && !(q.reviewStatus === 'retired' && q.releasedIn) && modo === 'prod') {
        if (todo.includes(`id:"${q.id}"`) || todo.includes(`"id":"${q.id}"`)) err(`el paquete contiene la pregunta no habilitada ${q.id} (${q.reviewStatus})`);
      }
    }
  }
} catch (e) { console.warn('AVISO: no se pudo comparar con el banco (' + e.message + ')'); }
if (m && esperado !== null && modo === 'prod' && m.length !== esperado) err(`el paquete lleva ${m.length} preguntas habilitadas y el banco tiene ${esperado}`);
if (!m && modo === 'prod') err('no se encontraron preguntas en el paquete');

if (errores.length) {
  console.error('COMPILACIÓN NO APTA PARA PUBLICAR:\n- ' + errores.join('\n- '));
  process.exit(1);
}
console.log(`Compilación ${modo} correcta: ${ficheros.length} ficheros, ${m ? m.length : 0} preguntas habilitadas, sin material interno.`);
