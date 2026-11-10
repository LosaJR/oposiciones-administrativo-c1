// Controles previos a publicar en producción. No publica nada: solo comprueba y dice si el commit actual de develop es apto.
// Uso: npm run pre-publicacion        (desde la raíz del repositorio, con la rama develop actualizada)
// Comprueba: rama y árbol limpio, commit exacto, pruebas, tipos, lint, validador, compilación de producción (PWA, contenido
// sin material interno ni preguntas no habilitadas) y compilación del laboratorio con comprobación de aislamiento entre ambos.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const BASE = '/oposiciones-administrativo-c1/';
const resultados = [];
function sh(cmd, env = {}, ok = true) {
  const r = spawnSync(cmd, { shell: true, encoding: 'utf8', env: { ...process.env, ...env, MSYS_NO_PATHCONV: '1' } });
  return { ok: r.status === 0, out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim(), ok2: ok };
}
function paso(nombre, cmd, env) {
  const r = sh(cmd, env);
  resultados.push({ nombre, ok: r.ok });
  console.log(`${r.ok ? 'OK ' : 'FALLA'}  ${nombre}`);
  if (!r.ok) console.log(r.out.split('\n').slice(-12).map((l) => '      ' + l).join('\n'));
  return r;
}

sh('git fetch origin');
const rama = sh('git branch --show-current').out;
const sucio = sh('git status --porcelain').out;
const head = sh('git rev-parse HEAD').out;
const remoto = sh('git rev-parse origin/develop').out;
resultados.push({ nombre: 'rama develop', ok: rama === 'develop' });
resultados.push({ nombre: 'árbol de trabajo limpio', ok: sucio === '' });
resultados.push({ nombre: 'HEAD = origin/develop (lo publicado en el laboratorio)', ok: head === remoto });
console.log(`Commit evaluado: ${head}\nRama: ${rama}; árbol ${sucio === '' ? 'limpio' : 'CON CAMBIOS'}; origin/develop ${remoto === head ? 'igual' : 'DISTINTO'}`);

paso('pruebas automáticas', 'npm test');
paso('TypeScript', 'npx tsc --noEmit');
paso('lint', 'npm run lint');
paso('validación del banco', 'npm run validate');
rmSync('site', { recursive: true, force: true });
rmSync('dist', { recursive: true, force: true });
const ver = { VITE_APP_VERSION: head.slice(0, 7), VITE_BUILD_DATE: sh('git show -s --format=%cI HEAD').out };
paso('compilación de producción', 'npm run build', { ...ver, VITE_ENV: 'prod', VITE_BASE: BASE });
paso('PWA de producción (alcance, manifiesto, precaché)', 'node scripts/check-pwa.mjs dist');
paso('contenido de producción (solo preguntas habilitadas, sin material interno)', 'node scripts/check-dist.mjs dist prod');
mkdirSync('site/laboratorio', { recursive: true });
cpSync('dist', 'site', { recursive: true });
rmSync('dist', { recursive: true, force: true });
paso('compilación del laboratorio', 'npm run build:lab', { ...ver, VITE_BASE: `${BASE}laboratorio/` });
paso('PWA del laboratorio', 'node scripts/check-pwa.mjs dist');
cpSync('dist', 'site/laboratorio', { recursive: true });
paso('producción y laboratorio independientes (service worker, caché, alcance)', 'node scripts/check-sw.mjs site');
rmSync('site', { recursive: true, force: true });
rmSync('dist', { recursive: true, force: true });

const fallos = resultados.filter((r) => !r.ok);
console.log('\n' + (fallos.length ? `NO APTO: ${fallos.length} control(es) en rojo → ${fallos.map((f) => f.nombre).join('; ')}` : `APTO TÉCNICAMENTE: ${resultados.length} controles en verde para el commit ${head.slice(0, 7)}.`));
console.log('Pendientes manuales (no automatizables aquí): copias de seguridad del progreso, prueba en iPhone/PC tras publicar, autorización expresa del propietario.');
process.exit(fallos.length ? 1 : 0);
