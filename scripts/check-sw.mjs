// Comprueba que producción (raíz) y laboratorio (/laboratorio/) no se pisan, aunque comparten origen.
// Uso: node scripts/check-sw.mjs <carpeta-del-sitio>   (la raíz con el sitio de producción y laboratorio/ dentro)
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const site = process.argv[2];
if (!site) { console.error('Falta la carpeta del sitio'); process.exit(2); }
const errors = [];
const need = (cond, msg) => { if (!cond) errors.push(msg); };

const prodSw = join(site, 'sw.js');
const labSw = join(site, 'laboratorio', 'sw.js');
const hasApp = existsSync(prodSw);
if (!hasApp) {
  console.log('Producción aún sin aplicación (página provisional): nada que comprobar en la raíz.');
} else {
  const p = readFileSync(prodSw, 'utf-8');
  need(p.includes('agec1-prod'), 'el SW de producción no usa el prefijo de caché agec1-prod');
  need(/denylist:\s*\[\s*\/\\\/laboratorio\\\/\//.test(p), 'el SW de producción no excluye /laboratorio/ de la navegación');
  need(!p.includes('agec1-lab'), 'el SW de producción menciona la caché del laboratorio');
  const m = JSON.parse(readFileSync(join(site, 'manifest.webmanifest'), 'utf-8'));
  need(m.scope === m.start_url, 'el manifiesto de producción tiene scope distinto de start_url');
  need(!existsSync(join(site, 'version.json')) || JSON.parse(readFileSync(join(site, 'version.json'), 'utf-8')).env === 'prod', 'version.json de la raíz no es de producción');
}
if (existsSync(labSw)) {
  const l = readFileSync(labSw, 'utf-8');
  need(l.includes('agec1-lab'), 'el SW del laboratorio no usa el prefijo agec1-lab');
  need(!l.includes('agec1-prod'), 'el SW del laboratorio menciona la caché de producción');
  const m = JSON.parse(readFileSync(join(site, 'laboratorio', 'manifest.webmanifest'), 'utf-8'));
  need(m.scope.endsWith('/laboratorio/'), 'el alcance del laboratorio no termina en /laboratorio/');
  need(JSON.parse(readFileSync(join(site, 'laboratorio', 'version.json'), 'utf-8')).env === 'lab', 'version.json del laboratorio no es de laboratorio');
} else {
  errors.push('falta el service worker del laboratorio');
}
if (errors.length) { console.error('ERRORES:\n- ' + errors.join('\n- ')); process.exit(1); }
console.log('OK: producción y laboratorio tienen cachés, alcance y versión independientes.');
