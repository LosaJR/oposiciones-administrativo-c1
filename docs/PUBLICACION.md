# Procedimiento de publicación en producción (primera versión estable)

Este documento **no autoriza nada**: describe cómo publicar cuando el propietario lo autorice expresamente. Hasta entonces no se fusiona la PR 1, no se toca `main` y no se publica en la raíz del sitio.

## 0. Principios
- `main` solo cambia mediante la PR 1 (`develop` → `main`). Protección actual de `main` (comprobada con la API de GitHub): pull request obligatoria, comprobación requerida «Lint, tipos, pruebas, validación del banco y compilación», reglas también para administradores, sin force-push y sin borrado de la rama. No requiere aprobaciones de terceros (0): la autorización es la del propietario.
- El despliegue (`.github/workflows/pages.yml`) construye **siempre** `main` en la raíz y `develop` en `/laboratorio/` en un único artefacto de Pages. Publicar producción **no borra ni congela el laboratorio** y `develop` sigue siendo la rama de trabajo.
- Se fusiona con «Create a merge commit» (no squash) para que `develop` y `main` conserven historia común y las siguientes versiones sean otra PR `develop` → `main` sin conflictos.
- La aplicación se presenta como **material de estudio no oficial ni certificado**; las preguntas están verificadas por IA contra su fuente, sin revisión humana independiente (aviso visible en Inicio y Ajustes).

## 1. Commit exacto que se publica
1. El candidato es el HEAD de `develop` en el momento de la autorización. Se fija con `git fetch origin && git rev-parse origin/develop` y se anota aquí y en la PR: `SHA = ______________________`.
2. Los controles de la sección 2 se ejecutan **sobre ese SHA**. Si `develop` avanza después, se vuelven a ejecutar y se anota el SHA nuevo.
3. La cabeza de la PR 1 (`gh pr view 1 --json headRefOid`) debe ser ese SHA. Solo se fusiona esa cabeza.

## 2. Controles que deben estar en verde
Ejecutar `npm run pre-publicacion` (no publica nada). Comprueba, sobre el commit actual:
| Control | Qué demuestra |
|---|---|
| Rama `develop`, árbol limpio, HEAD = `origin/develop` | Se evalúa exactamente lo que está en el laboratorio |
| `npm test` (91 pruebas) | Reglas del examen, puntuación, persistencia, actualización sin perder historial, estadística del banco, filtro de producción, documentación = datos |
| `tsc --noEmit` y `eslint` | Tipos y estilo |
| `npm run validate` | Citas literales en la fuente, hash de artículos, estructura, supuestos completos |
| Compilación de producción + `check-pwa` | Manifiesto, alcance, precaché, versión |
| `check-dist prod` | Solo preguntas habilitadas, sin campos internos de auditoría, sin material de trabajo ni datos personales |
| Compilación del laboratorio + `check-sw` | Producción y laboratorio con alcance, caché y service worker independientes |

Además, antes de autorizar (no están en el script porque usan red):
- `npm run check:vigencia` → todas las normas del BOE «SIN CAMBIOS» (si alguna cambia, `docs/ESTADO.md` y el validador indican qué preguntas reauditar).
- `npm run check:links` → 0 enlaces rotos (los 403 de Microsoft y la OGP son bloqueos a clientes automáticos).
- PR 1: las comprobaciones de GitHub en verde sobre la cabeza de la PR y `mergeStateStatus` = CLEAN.
- `docs/DECISION_PRODUCCION.md` sin ningún «NO APTO».

## 3. Copias de seguridad del progreso (antes de publicar)
El progreso vive solo en el navegador (IndexedDB `agec1-lab` en el laboratorio, `agec1-prod` en producción); no hay servidor ni cuentas.
1. En **cada dispositivo** (iPhone y PC): laboratorio → Ajustes → «Exportar copia (JSON)». Guardar el archivo fuera del dispositivo (iCloud, correo a uno mismo, etc.).
2. Comprobar que el archivo se abre y contiene `"app":"agec1"`, intentos y estadísticas; guardar dos copias.
3. Publicar **no borra** esos datos: producción usa otra base (`agec1-prod`) y el laboratorio sigue intacto.
4. Después de publicar, si se quiere llevar el historial a producción: producción → Ajustes → «Importar y fusionar» con el archivo exportado. Las preguntas retiradas antes de la publicación aparecerán en el historial como «ya no está en el banco» (limitación conocida; no afecta a las puntuaciones ya calculadas).

## 4. Fusión (solo con autorización expresa)
1. Comprobar la sección 2 y que la PR 1 apunta al SHA anotado.
2. Actualizar la descripción de la PR con el SHA y las cifras vigentes.
3. Fusionar la PR 1 con «Create a merge commit». No se borra `develop`.
4. El push a `main` lanza el workflow: construye `main` en `/` y `develop` en `/laboratorio/`, ejecuta `check-pwa`, `check-dist` y `check-sw`, y despliega. Si cualquier comprobación falla, **no se despliega** y la producción anterior (página provisional) se mantiene.
5. Confirmar con `curl https://losajr.github.io/oposiciones-administrativo-c1/version.json` que `version` = los 7 primeros caracteres del SHA fusionado y `env` = `prod`; y `.../laboratorio/version.json` con `env` = `lab`.

## 5. Comprobación posterior de producción
Hacerla en este orden, primero en el PC y después en el iPhone (ver también `docs/CHECKLIST_IPHONE.md`):
| # | Comprobación | Resultado esperado |
|---|---|---|
| 1 | Abrir la URL raíz; Inicio y Ajustes muestran el aviso de material no oficial | Visible; sin cinta «Laboratorio» |
| 2 | Ajustes → Fiabilidad del banco | 1.225 auditadas, 0 pendientes, 0 retiradas |
| 3 | Test por tema (práctica y examen), un tema de cada bloque I–VI | Preguntas, explicaciones y fuentes correctas |
| 4 | Simulacro completo | 40 + 30 + un supuesto de 20 a elegir entre dos; 100 minutos; −1/3 por error; reservas |
| 5 | Cerrar y reabrir a mitad de simulacro | Respuestas y tiempo restante recuperados |
| 6 | Entregar y revisar el resultado | Puntuación, explicaciones, historial y estadísticas coherentes |
| 7 | Importar la copia del laboratorio (opcional) | Intentos y estadísticas fusionados |
| 8 | Instalar como aplicación (Compartir → Añadir a pantalla de inicio / instalar en Chrome) | Se abre sin barra del navegador |
| 9 | Modo avión / sin conexión | Abre y permite estudiar |
| 10 | Actualizaciones: tras una publicación posterior, aviso de versión nueva y aceptación sin perder progreso | El progreso se conserva |
| 11 | Independencia: en la consola de producción `caches.keys()` solo `agec1-prod-…` y `indexedDB.databases()` incluye `agec1-prod`; en el laboratorio `agec1-lab-…` y `agec1-lab` | Sin solapamiento; el laboratorio sigue funcionando |

## 6. Plan de reversión
Los datos de los usuarios son locales: ninguna reversión los borra.
1. **Problema de contenido** (una pregunta errónea): no revertir; retirarla (`data/review3-patches.json` → `remove`, con `releasedIn` si ya estaba publicada para conservar su texto en el historial), PR nueva a `main` y desplegar. Plazo habitual: minutos.
2. **Problema funcional leve**: corrección en `develop` y nueva PR (roll-forward).
3. **Problema grave que impida usar la aplicación**: PR de reversión (`git revert -m 1 <merge>` sobre una rama nueva desde `main`) y fusión con las mismas protecciones. Restaura la página provisional. Aviso: los dispositivos que ya instalaron la aplicación conservan en caché la versión publicada mientras no se publique otra; por eso es preferible una corrección hacia delante (puntos 1 y 2). Si hiciera falta forzar la salida de esos dispositivos, habría que publicar un service worker de desinstalación (no está implementado).
4. Volver a «re-ejecutar el despliegue anterior» **no** revierte: el workflow vuelve a construir `main` desde su estado actual.
5. En todos los casos, anotar el incidente y el SHA en `docs/DECISIONES.md`.

## 7. Después de publicar
- `develop` sigue siendo la rama de trabajo; el laboratorio se actualiza con cada push a `develop` sin tocar producción.
- Las siguientes versiones de producción repiten este procedimiento (PR `develop` → `main`).
- Ampliar o corregir contenidos: nuevo lote en `data/drafts/` → `build_batch.py` → `npm run validate` → evaluación a ciegas de lo nuevo (`scripts/audit-list.py`) → laboratorio → PR.
