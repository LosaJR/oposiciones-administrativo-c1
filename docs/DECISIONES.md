# Decisiones del proyecto

## D-001 · Fuente de verdad del examen (2026-11-09)
- Se leyó directamente el **Anexo III de BOE-A-2025-26262** (Resolución de 18/12/2025, BOE 22/12/2025). Confirma: ejercicio único en dos partes, ambas obligatorias y eliminatorias; parte 1 de un máximo de 70 preguntas (40 de bloques I–V, 30 del bloque VI, hasta 5 de reserva); parte 2 un supuesto a elegir entre dos, de 20 preguntas (hasta 5 de reserva); **100 minutos**; error = −1/3; blanco = 0; el segundo supuesto marcado o ninguno anula la corrección de la parte 2; Windows 11 y Microsoft 365 de escritorio.
- Detalle adicional que el kit no recogía: la puntuación directa mínima fijada por la Comisión **no puede ser inferior al 30 % de la directa máxima** (21 sobre 70 y 6 sobre 20). Por eso el cupo "norma común 13" coincide con ese suelo.
- Búsqueda de convocatoria posterior (2026-11-09): **no se localizó** ninguna convocatoria nueva de ingreso libre. La OEP 2026 (BOE-A-2026-9946) no es una convocatoria. Se mantiene el perfil 2025 como `vigente` hasta que aparezca otra.

## D-002 · Cortes históricos en tercios enteros
La nota INAP del 29/09/2026 publica 31,67 y 12,67 (general) y 21 y 6 (cupo norma común 13). Las puntuaciones directas son siempre múltiplos de 1/3 (`aciertos − errores/3`), y el único múltiplo que se muestra como 31,67 es 95/3; 12,67 es 38/3. Se comparan **enteros** `3·aciertos − errores` contra 95 y 38 (63 y 18 en el cupo 13). Nunca se compara con decimales redondeados.

## D-003 · Convocatorias futuras
`futureCall.part1MinThirds = null`. Mientras no haya cortes oficiales no se declara "aprobado" ni "suspenso" oficial: se compara con el histórico y se etiqueta "referencia histórica". La transformación a escala 0–50 solo se muestra como **estimación lineal de entrenamiento** (el INAP publica los puntos fijos M→25 y N→50, no la fórmula intermedia).

## D-004 · Producción y laboratorio comparten origen
`losajr.github.io` aloja ambos. Por eso:
- IndexedDB/localStorage con prefijo por entorno (`agec1-prod`, `agec1-lab`).
- Service worker de producción con denylist de `/laboratorio/` y prefijos de caché distintos.
- `version.json` lleva el **SHA del commit de la rama** de cada entorno y la fecha del commit (no la del reloj). Hay un segundo canal de aviso, el service worker: si el JS cambiase de bytes en cada compilación, `sw.js` cambiaría y producción mostraría «hay una versión nueva» tras cada push al laboratorio. Por eso la fecha de compilación sale de `git show -s --format=%cI HEAD` (`VITE_BUILD_DATE`). Comprobado: dos compilaciones del mismo commit dan los mismos hashes de `sw.js`, de los `.js`, de `index.html`, `manifest` y `version.json`.
- Enrutado con HashRouter (recargar nunca da 404 en Pages).
- `main` solo contiene infraestructura y una página provisional hasta que el usuario apruebe la primera publicación.

## D-005 · Estados de las preguntas
`source_linked_pending_individual_audit` → `audited_current` (solo con `evidence_quote` verificada por script contra el texto consolidado cacheado, `reviewed_at` y `reviewer_notes`) → `retired`. En producción solo se muestran `audited_current`. En laboratorio existe un interruptor "incluir pendientes" para probar los motores. Todas las auditorías de este repositorio las hace Claude contra el texto oficial; **no hay revisión humana independiente** y la app lo indica (`reviewer: "claude-source-check"`).

## D-006 · Skills pedidas
`/frontend-design:frontend-design` existe y se usó para el diseño. `/loop` existe pero solo encaja en tandas de auditoría/ampliación; no se ha lanzado en bucle automático. `/modo-eficiente` **no está disponible** en esta instalación.

## D-007 · Páginas de Microsoft: solo fragmentos
El texto completo de las páginas de Microsoft Support tiene derechos de terceros y no se publica: `data/source-cache/ms-*.json` está en `.gitignore`. En el repositorio solo hay `data/source-excerpts/web.json` (URL, fecha de consulta, hash del texto completo y las frases citadas). El validador usa ese archivo cuando falta la copia completa (CI) y exige que el hash coincida con el de la auditoría. Para reauditar hay que volver a descargar la página con `scripts/fetch_sources.py`.

## D-008 · Textos del BOE
El texto consolidado del BOE se guarda por artículo en `data/source-cache/` para poder comprobar las citas. Se reutiliza con atribución a la fuente (BOE, «Legislación consolidada», datos abiertos); el texto consolidado es informativo y no tiene valor oficial.

## D-009 · Sesgo de longitud (defecto conocido)
En las preguntas auditadas hasta ahora la opción correcta es la más larga con una frecuencia superior a la deseable (el validador mide ~58 %), lo que enseña una estrategia equivocada. No se ha reescrito todo el banco. `scripts/build_batch.py` rechaza desde ahora cualquier lote nuevo con más de un 40 % de correctas más largas; los lotes anteriores están exentos (`LEGACY`) hasta que se alarguen sus distractores.
