// Comprueba que una compilación (carpeta dist o el laboratorio dentro de site/) cumple lo mínimo de una PWA instalable y con uso sin conexión.
// Uso: node scripts/check-pwa.mjs <carpeta>      p. ej.  node scripts/check-pwa.mjs dist   |   node scripts/check-pwa.mjs site/laboratorio
// NO sustituye a probar la instalación, el modo sin conexión y la actualización en un dispositivo real (docs/CHECKLIST_IPHONE.md).
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('Falta la carpeta'); process.exit(2); }
const errors = [];
const need = (c, m) => { if (!c) errors.push(m); };
const read = (f) => readFileSync(join(dir, f), 'utf8');

need(existsSync(join(dir, 'manifest.webmanifest')), 'falta manifest.webmanifest');
need(existsSync(join(dir, 'sw.js')), 'falta sw.js');
need(existsSync(join(dir, 'index.html')), 'falta index.html');
need(existsSync(join(dir, 'version.json')), 'falta version.json');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

const m = JSON.parse(read('manifest.webmanifest'));
need(m.name && m.short_name, 'el manifiesto no tiene name y short_name');
need(m.display === 'standalone', 'display debe ser standalone');
need(m.start_url === m.scope, 'start_url y scope deben coincidir');
need(m.scope?.startsWith('/') && m.scope.endsWith('/'), 'scope debe ser una ruta absoluta terminada en /');
need(m.lang === 'es', 'lang del manifiesto distinto de es');
need(/^#[0-9a-f]{6}$/i.test(m.theme_color ?? '') && /^#[0-9a-f]{6}$/i.test(m.background_color ?? ''), 'theme_color y background_color deben ser colores hexadecimales');
for (const size of ['192x192', '512x512']) {
  const ic = (m.icons ?? []).find((i) => i.sizes === size && i.type === 'image/png');
  need(!!ic, `falta un icono PNG de ${size}`);
  if (ic) need(existsSync(join(dir, ic.src)) && statSync(join(dir, ic.src)).size > 500, `el icono ${ic.src} no existe o está vacío`);
}
need((m.icons ?? []).some((i) => /maskable/.test(i.purpose ?? '')), 'falta un icono maskable');

const html = read('index.html');
need(/<html[^>]*lang="es"/.test(html), 'index.html sin lang="es"');
need(/name="viewport"[^>]*width=device-width/.test(html), 'index.html sin viewport adaptable');
need(/rel="manifest"/.test(html), 'index.html no enlaza el manifiesto');
need(/rel="apple-touch-icon"/.test(html), 'falta apple-touch-icon (iPhone)');
need(/apple-mobile-web-app-capable/.test(html), 'falta apple-mobile-web-app-capable');
need(!/(src|href)="http:\/\//.test(html), 'index.html carga recursos por http');
const assets = [...html.matchAll(/(?:src|href)="(\/[^"]+\/assets\/[^"]+)"/g)].map((x) => x[1]);
need(assets.length >= 2, 'index.html no referencia los recursos compilados');
for (const a of assets) need(a.startsWith(m.scope), `el recurso ${a} está fuera del alcance ${m.scope}`);

const sw = read('sw.js');
need(/SKIP_WAITING/.test(sw), 'el service worker no espera la orden SKIP_WAITING (la actualización debe ser manual)');
need((sw.match(/skipWaiting\(\)/g) ?? []).length === 1, 'el service worker llama a skipWaiting fuera del mensaje de actualización');
need(/precacheAndRoute/.test(sw), 'el service worker no precachea la aplicación');
need(/createHandlerBoundToURL\("index\.html"\)/.test(sw), 'sin respaldo de navegación a index.html para uso sin conexión');
need(/cleanupOutdatedCaches/.test(sw), 'el service worker no limpia cachés antiguas');
const pre = [...sw.matchAll(/url:"([^"]+)"/g)].map((x) => x[1]);
need(pre.includes('index.html'), 'index.html no está en el precaché');
for (const a of assets) need(pre.some((p) => a.endsWith('/' + p)), `el recurso ${a} no está en el precaché`);
need(!pre.includes('version.json'), 'version.json no debe precachearse (se consulta en red para detectar versiones nuevas)');
const bytes = pre.reduce((n, p) => n + (existsSync(join(dir, p)) ? statSync(join(dir, p)).size : 0), 0);
need(bytes < 8 * 1024 * 1024, `precaché de ${(bytes / 1048576).toFixed(1)} MB: demasiado grande para móviles`);

const v = JSON.parse(read('version.json'));
need(v.version && v.env && v.builtAt, 'version.json incompleto');
need(v.env === (/\/laboratorio\/$/.test(m.scope) ? 'lab' : 'prod'), `el entorno de version.json (${v.env}) no coincide con el alcance ${m.scope}`);

if (errors.length) { console.error('PWA incorrecta:\n- ' + errors.join('\n- ')); process.exit(1); }
console.log(`PWA correcta: ${m.name} · alcance ${m.scope} · ${pre.length} entradas de precaché (${(bytes / 1048576).toFixed(2)} MB) · versión ${v.version} (${v.env})`);
