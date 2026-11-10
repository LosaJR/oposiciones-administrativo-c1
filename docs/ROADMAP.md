# Hoja de ruta (estado)

El ROADMAP original del kit está en `_kit_original/AGE_C1_Claude_Kit/ROADMAP.md` (fuera del repositorio). Este archivo recoge el estado real de cada fase; el detalle y las cifras están en `docs/ESTADO.md` y los criterios de calidad en `docs/CALIDAD.md`. Solo se marca lo comprobado.

Referencia oficial: convocatoria 2025, BOE-A-2025-26262 (revisado el 2026-11-09: sin convocatoria posterior).

## Fases 0 y 1 · Reglas y base de la aplicación
- [x] Documentación (`docs/DECISIONES.md`, `docs/ESTADO.md`, `docs/CALIDAD.md`), React + TypeScript + Vite, HashRouter, IndexedDB con migraciones, PWA con actualización manual, entornos laboratorio (`develop`, `/laboratorio/`) y producción (`main`, raíz) separados.
- [x] Protección de ramas y workflow de Pages; producción no publicada.

## Fase 2 · Modelo de contenidos
- [x] `Question` con fuente, localizador, cita literal, hash, estado de auditoría y obsolescencia; `CaseFile` con narrativa, 20 preguntas y 5 reservas.
- [x] Opciones con identificador estable y orden aleatorio en cada intento.

## Fase 3 · Banco y auditoría
- [x] Los 45 temas con >= 10 preguntas auditadas (cifras vigentes en `docs/ESTADO.md`).
- [x] Supuestos: 13 completos (objetivo 10-15).
- [x] Más de 1.000 preguntas auditadas.
- [x] Evaluaciones a ciegas por IA: 757 preguntas distintas en tres rondas, incluidos los 13 supuestos (`docs/AUDITORIA.md`).
- [x] Ronda de estabilización: distractores reescritos (105), correcciones jurídicas y reevaluación a ciegas de lo modificado y de una muestra nueva.
- [x] Matriz del programa oficial por subapartado (`docs/COBERTURA.md`).
- [ ] Revisión humana independiente: ninguna.
- [ ] Lagunas de contenido sin fuente primaria cargada: nóminas (confección), hardware/software genérico, atención a personas con discapacidad, páginas web públicas, ventanilla única, libreta de direcciones de Outlook (ver `docs/ESTADO.md`).

## Fase 4 · Tests individuales y entrenamiento
- [x] Test por tema con modo práctica y modo examen; repaso de fallos; entrenamiento equilibrado (10/20/30/50).
- [x] Sesión recuperable tras cerrar el navegador (probado con recarga).

## Fase 5 · Simulacro
- [x] Formato oficial 40 + 30 + un supuesto de 20 entre dos, 100 min, −1/3, reservas; resultados distintos según el formato; sin veredicto para convocatorias futuras.
- [x] Preferencia por preguntas no vistas dentro de cada tema sin cambiar el formato.

## Fase 6 · Calidad, móvil y PWA
- [x] Estadística del banco (longitud 26,6 %, posiciones equilibradas), pruebas automáticas (87), validador en CI, aislamiento de service workers comprobado por script.
- [x] Móvil 320/375/390 px y persistencia del historial comprobados en el navegador integrado.
- [x] Service worker, instalación, sin conexión y actualización sin perder progreso: probados por el propietario en iPhone/Safari (2026-11-10).
- [ ] Aislamiento laboratorio/producción con ambas instaladas: pendiente hasta que exista producción.
- [x] Accesibilidad automática (axe-core en jsdom), comprobación de PWA compilada y de enlaces/vigencia semanal.
- [x] Contraste y WCAG 2.2 AA automáticos con axe-core en navegador real (9 rutas y una sesión, tema claro y oscuro): tres fallos corregidos. [ ] Falta la auditoría manual completa (lector de pantalla, teclado).
- [x] Actualización sin perder historial y cifras de la documentación = banco (`tests/update.test.ts`, `tests/docs.test.ts`).

## Fase 7 · Publicación
- [x] Laboratorio actualizado en `develop`.
- [ ] Producción: requiere autorización expresa; la PR 1 no se ha fusionado.
