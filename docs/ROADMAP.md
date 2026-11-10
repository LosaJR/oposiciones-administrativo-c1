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
- [x] Los 45 temas con >= 10 preguntas auditadas (1.006 en total: 628 teoría, 128 ofimática, 250 de supuestos).
- [x] Supuestos: 10 completos (objetivo 10-15).
- [x] Más de 1.000 preguntas auditadas (1.006).
- [ ] Revisión humana independiente: ninguna.

## Fase 4 · Tests individuales y entrenamiento
- [x] Test por tema con modo práctica y modo examen; repaso de fallos; entrenamiento equilibrado (10/20/30/50).
- [x] Sesión recuperable tras cerrar el navegador (probado con recarga).

## Fase 5 · Simulacro
- [x] Formato oficial 40 + 30 + un supuesto de 20 entre dos, 100 min, −1/3, reservas; resultados distintos según el formato; sin veredicto para convocatorias futuras.
- [x] Preferencia por preguntas no vistas dentro de cada tema sin cambiar el formato.

## Fase 6 · Calidad, móvil y PWA
- [x] Estadística del banco (longitud 24,5 %, posiciones equilibradas), pruebas automáticas (68), validador en CI, aislamiento de service workers comprobado por script.
- [x] Móvil 320/375/390 px y persistencia del historial comprobados en el navegador integrado.
- [x] Service worker, instalación, sin conexión y actualización sin perder progreso: probados por el propietario en iPhone/Safari (2026-11-10).
- [ ] Aislamiento laboratorio/producción con ambas instaladas: pendiente hasta que exista producción.
- [x] Accesibilidad automática (axe-core en jsdom), comprobación de PWA compilada y de enlaces/vigencia semanal.
- [ ] Contraste y WCAG 2.2 AA completos con herramienta en navegador real: pendientes.

## Fase 7 · Publicación
- [x] Laboratorio actualizado en `develop`.
- [ ] Producción: requiere autorización expresa; la PR 1 no se ha fusionado.
