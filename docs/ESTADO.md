# Estado del proyecto

Última actualización: 2026-11-09 (segunda sesión de trabajo). Solo se marca `[x]` lo ejecutado y comprobado. Lo pendiente figura con su motivo.

## Cifras reales (salida de `npm run validate`)
- Preguntas auditadas: **473** (377 de teoría, 46 de ofimática, 50 de supuestos). Pendientes de la semilla: 10. Retiradas: 7.
- Supuestos completos de 20 preguntas con narrativa y 5 reservas cada uno: **2**.
- Los **45 temas** tienen al menos una pregunta auditada.
- Verificación: cada pregunta pasa la validación automática (cita literal en la fuente cacheada, hash del artículo, estructura, coherencia entre el artículo citado y la ancla). Todas fueron redactadas y comprobadas por Claude contra el texto oficial ("revisión por IA"). **Revisión humana independiente: 0.**

### Profundidad por tema (preguntas auditadas de teoría y ofimática, sin contar supuestos)
- **Objetivo (>= 10), 17 temas:** I-01, I-02, I-03, I-04, I-05, I-07, I-08, I-09, I-11, II-01, II-04, III-01, III-03, III-04, III-07, IV-08, VI-05.
- **Básica (5-9), 21 temas:** I-06, I-10, II-03, III-02, III-06, IV-01, IV-02, IV-03, IV-04, IV-05, IV-06, IV-07, IV-09, V-01, V-02, V-03, V-04, V-06, VI-01, VI-03, VI-06.
- **Inicial (< 5), 7 temas:** II-02, III-05, V-05, VI-02, VI-04, VI-07, VI-08.
- El objetivo de 10-20 preguntas por tema **no se ha alcanzado** en 28 de los 45 temas. Un simulacro solo se llama "con formato oficial" si los 45 temas tienen al menos 5 preguntas (`DEPTH.min`); hoy se etiqueta "con formato oficial y cobertura temática insuficiente".
- Gobierno Abierto (I-06): solo hay preguntas de la Agenda 2030; la web de la OGP devolvió 403 y no se obtuvo otra fuente oficial legible.
- Internet y protocolos (VI-08) y hardware/software básico (VI-01): solo hay preguntas sobre Edge y Seguridad de Windows. Falta una fuente oficial para protocolos y conceptos de hardware.

## Fase 1 · Problemas detectados en la revisión de ChatGPT
- [x] **Reservas de los supuestos**: cada supuesto lleva hasta 5 reservas propias (`reserveQuestionIds`), `buildSimulacro` las incorpora en `reserve.cases` y `applyAnnulments` sustituye las anuladas por orden sin tocar las reservas del otro supuesto. Limitación documentada: las bases no dicen qué reserva sustituye a cuál ni cómo se anula; se aplica el orden. La aplicación no tiene pantalla para marcar preguntas anuladas (es un trámite posterior al examen real). Pruebas en `tests/core.test.ts`.
- [x] **Simulacros incompletos**: `Result.tsx` distingue (1) simulacro completo con formato oficial, (2) formato oficial con cobertura insuficiente, (3) parcial, (4) comparación con cortes históricos y (5) convocatoria futura sin cortes. Solo el caso (1) compara con un corte. Pruebas en `tests/results.test.ts`.
- [x] **Guardado de la sesión**: `SessionStore` serializa las escrituras y aplica cada cambio sobre el último estado, no sobre el render. Pruebas: 200 pulsaciones sin esperar, orden de escrituras con retardos distintos, entregar justo tras marcar, doble pulsación en Entregar, cierre de pestaña y recuperación, fallo de escritura con reintento.
- [x] **Protección de ramas**: `main` protegida (PR obligatorio, verificación obligatoria, sin fuerza ni borrado, también para administradores). `develop` sin fuerza ni borrado. Auto-merge desactivado. Las PR hacia `main` solo ejecutan la verificación, no despliegan.
- [x] **Service worker**: `scripts/check-sw.mjs` (se ejecuta en el workflow) comprueba que producción excluye `/laboratorio/` de su navegación, que las cachés son `agec1-prod` y `agec1-lab`, que el alcance del laboratorio termina en `/laboratorio/` y que las versiones son independientes. **No se pudo probar en un navegador local el registro de dos service workers** (el navegador integrado rechazó registrar el service worker local); el laboratorio sí se registra con su propio alcance en GitHub Pages. La producción aún no tiene aplicación, así que la interferencia real queda sin probar hasta publicar.

## Fase 2 · Temario
- [x] Los 45 temas tienen preguntas auditadas con explicación, referencia exacta y fecha de verificación.
- [ ] Profundidad de 10-20 por tema en todos los temas (ver arriba).
- [ ] 1.000 preguntas auditadas: no alcanzado (473). No se rellena con preguntas triviales.
- [ ] Clasificación de dificultad: el esquema tiene el campo `difficulty`, pero no se ha rellenado.

## Fase 3 · Supuestos
- [ ] Solo 2 supuestos completos (objetivo 10-15). No se marca como hecha.

## Fase 4 · Aleatorización y estadística
- [x] El sesgo de longitud bajó de ~59 % a menos del 40 % (los empates no cuentan) alargando un distractor en 41 preguntas y acortando correctas en lotes nuevos. `build_batch.py` rechaza lotes nuevos por encima del 40 % y el validador falla por encima del 50 %.
- [x] Pruebas estadísticas (`tests/quality.test.ts`): posición de la correcta (18-32 % por letra), longitud, preguntas casi duplicadas (enunciado parecido y misma correcta en el mismo tema), repetición de hechos, 150 simulacros sobre el banco real (40/30/20, 100 min, cobertura de preguntas, reparto por temas, rotación de supuestos, solape entre consecutivos < 55 %) y prioridad a las preguntas poco vistas.
- Pendiente: el solape entre simulacros consecutivos es alto (~46 %) porque muchos temas tienen pocas preguntas; baja al ganar profundidad.
- Las cuotas por tema son una heurística proporcional al número de temas del bloque; no hay cuotas oficiales.

## Fase 5 · Calidad del banco
- [x] Validación automática ampliada (coherencia localizador-ancla, hash de artículo, obsolescencia, páginas de terceros por fragmentos).
- [x] Distinción entre validación automática, revisión por IA y revisión humana (ver `docs/CALIDAD.md`). **No ha habido revisión humana independiente.**
- [ ] No se puede comprobar automáticamente que un enunciado no sea ambiguo ni que los distractores sean inequívocamente falsos: depende de la lectura. Queda como revisión humana pendiente.

## Fase 6 · Pruebas en móvil
- [x] Navegador integrado a 320, 375 y 390 px: sin desbordamiento horizontal en las 8 rutas principales (se corrigió un desbordamiento de tablas a 320 px) y objetivos táctiles de 44 px. Flujo de simulacro a 320 px: cambio de respuesta, toques rápidos, marcar duda, cambio de supuesto, hoja de respuestas, recarga con la sesión recuperada y temporizador por reloj de pared, entrega y resultado.
- [ ] Safari en iOS: sin acceso, pendiente.
- [ ] Instalación PWA real, funcionamiento sin conexión y actualización con examen en curso sobre la versión publicada: pendientes (solo hay pruebas unitarias del flujo y del determinismo de la compilación).
- [ ] Comprobación automática de enlaces y auditoría WCAG 2.2 AA con herramienta: no hechas.

## Fase 7 · Versión completa
- [x] Laboratorio en `develop`: https://losajr.github.io/oposiciones-administrativo-c1/laboratorio/
- [ ] Producción: no publicada ni fusionada. Requiere la aprobación expresa del propietario.
- [ ] La fase no está completa: faltan supuestos, profundidad, Safari y pruebas de PWA publicada.
