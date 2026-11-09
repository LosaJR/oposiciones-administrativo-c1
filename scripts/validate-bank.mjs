// Validador del banco: estructura, cobertura, citas literales y obsolescencia.
// Uso: node scripts/validate-bank.mjs [--strict-links]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf-8'));
const norm = (s) => s.split(String.fromCharCode(160)).join(" ").replace(/\s+/g, " ").trim();

const syllabus = read('data/syllabus.json');
const profile = read('data/exam-profile.json');
const cases = read('data/cases.json');
const topics = new Map(syllabus.topics.map((t) => [t.code, t]));
const files = readdirSync(join(root, 'data/questions')).filter((f) => f.endsWith('.json'));
const questions = files.flatMap((f) => read(`data/questions/${f}`).map((q) => ({ ...q, _file: f })));

const errors = [];
const warnings = [];
const err = (id, m) => errors.push(`${id}: ${m}`);

const cache = new Map();
const getCache = (k) => {
  if (!cache.has(k)) {
    const p = join(root, 'data/source-cache', `${k}.json`);
    cache.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf-8')) : null);
  }
  return cache.get(k);
};

const excerptsPath = join(root, 'data/source-excerpts/web.json');
const excerpts = existsSync(excerptsPath) ? JSON.parse(readFileSync(excerptsPath, 'utf-8')) : {};

const ids = new Set();
const stems = new Map();
const STATUS = new Set(['source_linked_pending_individual_audit', 'audited_current', 'stale', 'retired']);

for (const q of questions) {
  const id = q.id;
  if (ids.has(id)) err(id, 'id repetido');
  ids.add(id);
  const stem = norm(q.stem).toLowerCase();
  if (stems.has(stem)) err(id, `enunciado duplicado de ${stems.get(stem)}`);
  stems.set(stem, id);
  if (!STATUS.has(q.reviewStatus)) err(id, `estado inválido ${q.reviewStatus}`);
  if (!Array.isArray(q.options) || q.options.length !== 4) { err(id, 'debe tener 4 opciones'); continue; }
  if (new Set(q.options.map((o) => norm(o.text).toLowerCase())).size !== 4) err(id, 'opciones repetidas');
  if (new Set(q.options.map((o) => o.id)).size !== 4) err(id, 'ids de opción repetidos');
  if (!q.options.some((o) => o.id === q.correctOptionId)) err(id, 'la respuesta correcta no existe');
  const t = topics.get(q.topic);
  if (!t) err(id, `tema fuera de programa: ${q.topic}`);
  else {
    if (q.kind === 'office' && t.block !== 'VI') err(id, 'ofimática fuera del bloque VI');
    if (q.kind === 'theory' && t.block === 'VI') err(id, 'teoría en el bloque VI');
    if (q.kind === 'practical' && !['II', 'III', 'IV', 'V'].includes(t.block)) err(id, 'práctico fuera de bloques II-V');
  }
  if (!q.source?.url?.startsWith('https://')) err(id, 'sin URL de fuente https');
  if (!q.source?.locator) err(id, 'sin localizador');
  if (q.kind === 'practical' && !q.caseId) err(id, 'pregunta práctica sin caseId');

  if (q.reviewStatus === 'audited_current') {
    for (const f of ['evidenceQuote', 'reviewedAt', 'verifiedAt', 'reviewer', 'reviewerNotes', 'sourceHash', 'lawVersionDate']) if (!q[f]) err(id, `auditada sin ${f}`);
    if (!q.explanation || /pendiente de auditor/i.test(q.explanation) || q.explanation.length < 25) err(id, 'explicación vacía o provisional');
    const anchors = Array.isArray(q.source.anchor) ? q.source.anchor : [q.source.anchor];
    const c = q.source.cacheKey ? getCache(q.source.cacheKey) : null;
    if (!c && q.source.cacheKey && /^(ms|web)-/.test(q.source.cacheKey)) {
      // Páginas de terceros: no se publica el texto completo; se comprueba contra los fragmentos citados y el hash de la página.
      const ex = excerpts[q.source.cacheKey];
      if (!ex) err(id, `sin fragmentos de la página ${q.source.cacheKey} (ejecuta scripts/make_excerpts.py)`);
      else {
        if (ex.pageHash !== q.sourceHash) err(id, 'el hash de la página no coincide con el de la auditoría');
        if (!ex.excerpts.some((e) => norm(e).includes(norm(q.evidenceQuote || '')))) err(id, 'la cita no está entre los fragmentos guardados de la página');
      }
      continue;
    }
    if (!c) { err(id, `sin caché de fuente (${q.source.cacheKey})`); continue; }
    const texts = [];
    for (const a of anchors) {
      if (!c.articles[a]) err(id, `ancla ${a} inexistente en ${q.source.cacheKey}`);
      else texts.push(norm(c.articles[a].text));
    }
    if (texts.length) {
      if (!texts.some((x) => x.includes(norm(q.evidenceQuote || '')))) err(id, 'la cita literal NO aparece en la fuente cacheada');
      const h = createHash('sha256').update(texts.join('\n')).digest('hex');
      if (q.sourceHash && h !== q.sourceHash) err(id, 'el texto del artículo cambió desde la auditoría: reauditar o marcar stale (node scripts/mark-stale.mjs)');
    }
    if (c.derogada && c.derogada !== 'N') err(id, `la norma figura derogada (${c.derogada})`);
  }
}

// Supuestos
const byId = new Map(questions.map((q) => [q.id, q]));
for (const c of cases) {
  if (c.questionIds.length !== profile.part2.questions) err(c.id, `el supuesto debe tener ${profile.part2.questions} preguntas (tiene ${c.questionIds.length})`);
  for (const qid of c.questionIds) {
    const q = byId.get(qid);
    if (!q) { err(c.id, `pregunta ${qid} inexistente`); continue; }
    if (q.kind !== 'practical' || q.caseId !== c.id) err(c.id, `pregunta ${qid} inconsistente con el supuesto`);
    if (c.reviewStatus === 'audited_current' && q.reviewStatus !== 'audited_current') err(c.id, `supuesto auditado con pregunta no auditada ${qid}`);
  }
  const res = c.reserveQuestionIds ?? [];
  if (res.length > profile.part2.reserve) err(c.id, `más de ${profile.part2.reserve} reservas`);
  for (const rid of res) {
    const q = byId.get(rid);
    if (!q) { err(c.id, `reserva ${rid} inexistente`); continue; }
    if (q.kind !== 'practical' || q.caseId !== c.id) err(c.id, `reserva ${rid} inconsistente con el supuesto`);
    if (c.questionIds.includes(rid)) err(c.id, `reserva ${rid} repetida entre las 20 preguntas`);
    if (c.reviewStatus === 'audited_current' && q.reviewStatus !== 'audited_current') err(c.id, `reserva no auditada ${rid}`);
  }
  if (c.reviewStatus === 'audited_current' && (c.narrative || '').length < 200) err(c.id, 'supuesto auditado sin narrativa suficiente');
}
for (const q of questions) if (q.caseId && !cases.some((c) => c.id === q.caseId)) err(q.id, `caseId ${q.caseId} sin supuesto`);

// Avisos de calidad
const facts = new Map();
for (const q of questions) {
  if (q.reviewStatus !== 'audited_current') continue;
  if (q.fact) facts.set(q.fact, [...(facts.get(q.fact) ?? []), q.id]);
}
for (const [f, l] of facts) if (l.length > 1) warnings.push(`hecho repetido "${f}": ${l.join(', ')} (el simulacro no los junta)`);
const aud = questions.filter((q) => q.reviewStatus === 'audited_current');
const longest = aud.filter((q) => {
  const len = (o) => o.text.length;
  const max = Math.max(...q.options.map(len));
  // «más larga» estricta: un empate no delata la correcta
  return len(q.options.find((o) => o.id === q.correctOptionId)) === max && q.options.filter((o) => len(o) === max).length === 1;
}).length;
if (aud.length >= 20 && longest / aud.length > 0.5) err('banco', `sesgo de longitud: la correcta es la opción más larga en ${Math.round((100 * longest) / aud.length)} % de las preguntas (máximo 50 %)`);
if (aud.length >= 20 && longest / aud.length > 0.4) warnings.push(`sesgo: la correcta es la opción más larga en ${Math.round((100 * longest) / aud.length)} % de las preguntas`);
const posCount = [0, 0, 0, 0];
for (const q of aud) posCount[q.options.findIndex((o) => o.id === q.correctOptionId)]++;
if (aud.length >= 20 && Math.max(...posCount) / aud.length > 0.4) warnings.push(`sesgo de posición de la correcta: ${posCount.join('/')}`);

// Informe
const count = (s) => questions.filter((q) => q.reviewStatus === s).length;
const perTopic = new Map(syllabus.topics.map((t) => [t.code, { aud: 0, pend: 0, prac: 0 }]));
for (const q of questions) {
  const r = perTopic.get(q.topic);
  if (!r) continue;
  if (q.kind === 'practical') r.prac++;
  else if (q.reviewStatus === 'audited_current') r.aud++;
  else if (q.reviewStatus === 'source_linked_pending_individual_audit') r.pend++;
}
const missing = [...perTopic].filter(([, r]) => r.aud === 0).map(([c]) => c);
const auditedTheory = aud.filter((q) => q.kind === 'theory').length;
const auditedOffice = aud.filter((q) => q.kind === 'office').length;
const auditedPractical = aud.filter((q) => q.kind === 'practical').length;
const casesOk = cases.filter((c) => c.reviewStatus === 'audited_current').length;
console.log(`Preguntas: ${questions.length} | auditadas ${count('audited_current')} | pendientes ${count('source_linked_pending_individual_audit')} | stale ${count('stale')} | retiradas ${count('retired')}`);
console.log(`Auditadas por tipo: teoría ${auditedTheory} · ofimática ${auditedOffice} · supuestos ${auditedPractical} | supuestos completos auditados: ${casesOk}`);
console.log(`Temas con ≥1 pregunta auditada (no práctica): ${topics.size - missing.length}/${topics.size}`);
if (missing.length) console.log(`Temas SIN preguntas auditadas: ${missing.join(', ')}`);
console.log('Auditadas por tema: ' + [...perTopic].map(([c, r]) => `${c}=${r.aud}`).join(' '));
if (warnings.length) console.log('\nAVISOS:\n- ' + warnings.join('\n- '));
if (errors.length) {
  console.error(`\nERRORES (${errors.length}):\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log('\nOK: estructura, citas literales, obsolescencia y supuestos válidos.');
console.log('Recordatorio: esta validación es mecánica; no sustituye la revisión jurídica.');
