# Estado del proyecto

Última actualización: 2026-11-10 (tercera sesión de trabajo). Solo se marca `[x]` lo ejecutado y comprobado. Lo pendiente figura con su motivo.

## Cifras reales (salida de `npm run validate`, sin copias locales de páginas de terceros, como en CI)
- Preguntas auditadas: **1.006** (628 de teoría, 128 de ofimática, 250 de supuestos). Pendientes de la semilla: 10. Retiradas: 7.
- Supuestos completos de 20 preguntas con narrativa y 5 reservas cada uno: **10** (CASE-A a CASE-J: acto y procedimiento, responsabilidad patrimonial, personal, presupuesto, contratación, protección de datos, organización administrativa, subvenciones, igualdad y personal laboral).
- Los **45 temas** tienen al menos **10** preguntas auditadas de teoría u ofimática (sin contar supuestos).
- Verificación: cada pregunta pasa la validación automática (cita literal en la fuente cacheada, hash del artículo, estructura, coherencia entre el artículo citado y la ancla). Todas fueron redactadas y comprobadas por Claude contra el texto oficial («revisión por IA»). **Revisión humana independiente: 0.**

### Preguntas auditadas por tema (teoría y ofimática, sin supuestos)
| Bloque I | I-01 38 · I-02 14 · I-03 17 · I-04 11 · I-05 15 · I-06 12 · I-07 22 · I-08 14 · I-09 11 · I-10 13 · I-11 13 |
|---|---|
| Bloque II | II-01 12 · II-02 16 · II-03 17 · II-04 11 |
| Bloque III | III-01 12 · III-02 14 · III-03 42 · III-04 10 · III-05 12 · III-06 11 · III-07 16 |
| Bloque IV | IV-01 10 · IV-02 11 · IV-03 10 · IV-04 12 · IV-05 12 · IV-06 10 · IV-07 17 · IV-08 12 · IV-09 13 |
| Bloque V | V-01 13 · V-02 10 · V-03 10 · V-04 11 · V-05 10 · V-06 12 |
| Bloque VI (ofimática) | VI-01 12 · VI-02 10 · VI-03 12 · VI-04 18 · VI-05 37 · VI-06 13 · VI-07 13 · VI-08 13 |

- Todos los temas están en el nivel «objetivo» (>= 10). El **objetivo de 1.000 preguntas auditadas no se ha alcanzado** (804): no se rellena con preguntas triviales ni repetidas.
- Reparto de los supuestos: CASE-A (acto y procedimiento: II-03, III-02, III-03), CASE-B (responsabilidad patrimonial: III-03, III-06), CASE-C (personal: IV-04, IV-05, IV-06), CASE-D (presupuesto y gasto: V-01, V-02, V-03, V-05), CASE-E (contratación: III-04), CASE-F (protección de datos: II-04). Un supuesto solo puede cubrir bloques II a V; por eso un supuesto de transparencia (bloque I) se descartó y sus preguntas pasaron a la teoría de I-07.
- Gobierno Abierto (I-06): las preguntas son de la Agenda 2030 (ONU); la web de la OGP devolvió 403 y no se obtuvo otra fuente oficial legible, así que el concepto y los principios del gobierno abierto siguen sin cubrirse.
- Internet y protocolos (VI-08) y hardware/software básico (VI-01): solo hay preguntas sobre Edge y Seguridad de Windows. Falta una fuente oficial para protocolos y conceptos de hardware.

## P1 · Ofimática
- [x] De 46 a **128** preguntas auditadas de ofimática, repartidas en los 8 temas del bloque VI (VI-01 12, VI-02 10, VI-03 12, VI-04 18, VI-05 37, VI-06 13, VI-07 13, VI-08 13). Todas se apoyan en una frase literal de una página oficial de Microsoft Support (en CI se comprueban contra los fragmentos guardados en `data/source-excerpts/web.json`, no contra el texto completo, que no se publica).
- Limitación: el objetivo de 120-150 se cumple en total, pero VI-05 (Excel) pesa el 29 % del bloque y VI-02 (Windows) tiene solo atajos de teclado y Portapapeles; no se cubre todo el epígrafe oficial de cada tema (por ejemplo, Word: formato y combinar correspondencia; Access: informes). Los números de versión de Microsoft pueden cambiar.

## P2 · Supuestos prácticos
- [x] **4 supuestos nuevos** auditados (CASE-C a CASE-F), cada uno con narrativa propia, 20 preguntas ordinarias, 5 reservas y fechas verificadas con calendario. Total: **6**.
- [x] 10 supuestos (el mínimo del objetivo 10-15). Siguen sin supuesto propio retribuciones y nóminas, atención al público y Seguridad Social.

## P3 · Profundidad
- [x] Los 7 temas con menos de 5 preguntas (II-02, III-05, V-05, VI-02, VI-04, VI-07, VI-08) y los 21 con 5-9 están ahora en >= 10.
- [ ] Objetivo de 10-20 por tema: alcanzado el mínimo (10) en los 45; los temas complejos (por ejemplo, III-04 contratación, V-02 modificaciones presupuestarias, IV-06 régimen disciplinario) merecen más profundidad.

## P4 · Calidad
- [x] Las 42 preguntas con distractor alargado para corregir el sesgo de longitud se releyeron una a una (ambigüedad, respuesta parcialmente correcta, pistas estructurales). Se corrigió un distractor casi duplicado en Q-CA-11. Es una revisión por IA, **no** una revisión humana independiente.
- [x] Sesgo de longitud del banco completo: la correcta es la más larga (estrictamente) en el 24,5 % de las preguntas (azar: 25 %). Posición de la correcta: 26 % A, 25 % B, 25 % C, 24 % D.
- [x] Palabras absolutas: corregido el 2026-11-10 reescribiendo distractores sin cambiar su falsedad; a 2026-11-10: 3,3 % de las correctas y 4,7 % de los distractores. El validador y una prueba automática (`tests/quality.test.ts`) avisan si la razón supera 1,8 en cualquier sentido.
- [x] Vigencia y enlaces: `npm run check:vigencia`, `scripts/fetch_sources.py --refresh-changed` y flujo semanal `.github/workflows/vigencia.yml` (BOE + enlaces; 82 enlaces, 0 rotos, 9 avisos 403 de Microsoft). Se refrescaron Ley 40/2015, LGP y LGS (el validador sigue en verde).
- [x] Pruebas automáticas: accesibilidad con axe-core (9 rutas + canario; sin contraste, que jsdom no evalúa), `scripts/check-pwa.mjs` en el despliegue y persistencia (pruebas existentes).

## P5 · Dos modos de estudio
- [x] **Simulacro con formato oficial**: 40 + 30 + un supuesto de 20 a elegir entre dos, 100 minutos, −1/3 por error, reservas por supuesto. Solo se llama «oficial» si los 45 temas tienen al menos 5 preguntas (hoy sí). Con «evitar preguntas recientes» prefiere preguntas no vistas dentro de cada tema sin cambiar el formato. Sin cuotas oficiales por tema: el reparto es una heurística proporcional al número de temas.
- [x] **Entrenamiento equilibrado** (10/20/30/50 preguntas): prioriza fallos pendientes, temas con peor acierto o menos estudiados y preguntas no vistas; máximo por tema; no repite hechos; no incluye supuestos. Probado en el navegador integrado: 20 preguntas, 17 temas, máximo 2 por tema.

## P6 · Verificaciones finales
- [x] Compilación de producción del laboratorio (JS 1,3 MB, 278 KB comprimido; 20 entradas de precaché, 1,6 MB). `scripts/check-sw.mjs` comprueba el aislamiento de los service workers.
- [x] Persistencia: respuesta guardada al marcarla, sesión recuperada tras recargar con 1/20 respondidas, entrega con resultado, intento guardado en IndexedDB (`attempts`) y estadística por pregunta (`qstats`).
- [x] Móvil a 375 px: las pantallas de test y de sesión se muestran sin desbordamiento.
- [x] **Prueba manual del propietario en iPhone (Safari), 2026-11-10, sobre el laboratorio**: añadir a la pantalla de inicio, abrir como aplicación y adaptación a pantalla, simulacro con respuestas y cierre completo de la app, recuperación de respuestas y tiempo restante, modo avión (estudiar sin conexión), entrega con puntuación, explicaciones e historial, y detección de versión nueva sin perder el progreso: **todo OK**. No se anotaron modelo ni versión de iOS.
- [ ] El navegador integrado del entorno de desarrollo no registra service workers (rechazado en `localhost`): la PWA no se puede probar automáticamente aquí. Queda sin probar en Chrome de escritorio y con la producción real (aislamiento laboratorio/producción, `docs/CHECKLIST_IPHONE.md` §5 bis).
- [ ] Auditoría WCAG 2.2 AA con herramienta y comprobación automática de enlaces: no hechas.

## Publicación
- [x] Laboratorio en `develop`: https://losajr.github.io/oposiciones-administrativo-c1/laboratorio/
- [ ] Producción: no publicada ni fusionada (la PR 1 sigue abierta). Requiere la aprobación expresa del propietario.
