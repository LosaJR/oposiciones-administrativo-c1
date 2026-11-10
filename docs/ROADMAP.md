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
- [x] Los 45 temas con >= 10 preguntas auditadas (804 en total: 526 teoría, 128 ofimática, 150 de supuestos).
- [x] Supuestos: 6 completos (objetivo 10-15: pendiente).
- [ ] 1.000 preguntas auditadas: pendiente (804).
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
- [ ] Service worker real, instalación, sin conexión y actualización con examen en curso: sin probar (ver `docs/CHECKLIST_IPHONE.md`).
- [ ] Safari en iPhone: sin acceso.
- [ ] WCAG 2.2 AA con herramienta y comprobador de enlaces: pendientes.

## Fase 7 · Publicación
- [x] Laboratorio actualizado en `develop`.
- [ ] Producción: requiere autorización expresa; la PR 1 no se ha fusionado.
