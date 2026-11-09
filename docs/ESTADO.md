# Estado del proyecto (se actualiza en cada tanda)

Última actualización: 2026-11-09. Solo se marca `[x]` lo que se ha ejecutado y comprobado; el resto queda `[ ]` con su motivo.

## Cifras reales del banco (salida de `npm run validate`, 2026-11-09)
```
Preguntas: 303 | auditadas 286 | pendientes 10 | stale 0 | retiradas 7
Auditadas por tipo: teoría 217 · ofimática 29 · supuestos 40 | supuestos completos auditados: 2
Temas con ≥1 pregunta auditada (no práctica): 27/45
Temas SIN preguntas auditadas: I-06, I-08, I-11, II-01, II-04, III-01, III-04, III-06, III-07, IV-07, IV-08, IV-09, V-04, V-05, V-06, VI-01, VI-03, VI-08
```
Cada pregunta `audited_current` lleva una cita literal que el validador comprueba contra el texto oficial cacheado en `data/source-cache/`. El conjunto cubre 27 de los 45 temas; los 18 temas listados arriba aún no tienen preguntas auditadas y por tanto no entran en tests ni en simulacros (III-06 solo tiene el supuesto B).
Fuentes ya cacheadas y listas para auditar más temas: Constitución, Ley 39/2015, Ley 40/2015, TREBEP, LCSP, LGP, Ley 19/2013, LOPDGDD, LOPJ, LOTC, Defensor del Pueblo, LBRL, Ley 50/1997, LJCA, LGSS, MUFACE, Clases Pasivas, Ley 53/1984, LO 3/2007, Ley 15/2022, Ley 4/2023, Ley 39/2006, RDLeg 1/2013, LO 1/2004, RD 203/2021, LGS, Ley 2/2014. Faltan por localizar y cachear: IV Convenio único AGE, RGPD, Tratados de la UE, Agenda 2030, Gobierno Abierto, archivos y atención al público.

## Fase 0 · Reglas y documentación
- [x] Leído el kit (PROMPT, ROADMAP, README, FUENTES, perfil de examen, temario, semilla).
- [x] Contrastado el kit con el BOE: Anexo III de BOE-A-2025-26262 y la nota INAP del 29/09/2026 coinciden (ver `docs/DECISIONES.md`).
- [x] Buscada convocatoria posterior (2026-11-09): no se localizó. Perfil 2025 vigente.
- [x] `docs/DECISIONES.md` y este archivo.
- [x] Skills: `frontend-design` usada. `/loop` no se ha lanzado en bucle. `/modo-eficiente` no existe en esta instalación.
- [ ] Estrategia de licencias de contenidos INAP: de momento solo preguntas originales; no se copia ningún cuestionario INAP.

## Fase 1 · Base de la app
- [x] React + TypeScript + Vite, CSS móvil primero, modo claro/oscuro, iconos, HashRouter.
- [x] Navegación: Inicio, Temario, Test, Simulacro, Fallos, Estadísticas, Historial, Ajustes y fuentes.
- [x] IndexedDB con migraciones versionadas y bases separadas por entorno (`agec1-prod`, `agec1-lab`).
- [x] `base` de Vite configurable (`VITE_BASE`) para GitHub Pages.

## Fase 2 · Modelo de contenidos
- [x] `Question`, `CaseFile`, estados de revisión, IDs de opción estables, respuesta correcta como ID.
- [x] Cada pregunta auditada exige `source.url`, localizador, cita literal verificada, fecha y notas.
- [x] Importar/exportar progreso en JSON (validado). 
- [ ] Importador de preguntas en CSV (no hecho).

## Fase 3 · Banco y auditoría
- [x] Cache de fuentes por artículo desde la API de datos abiertos del BOE (`scripts/fetch_sources.py`) y páginas de Microsoft Support.
- [x] Constructor de lotes que **rechaza** cualquier cita que no aparezca literal en la fuente (`scripts/build_batch.py`).
- [x] Validador (`scripts/validate-bank.mjs`): estructura, 4 opciones distintas, citas, hash del artículo (obsolescencia), supuestos de 20, sesgos.
- [x] Auditadas: Constitución (I-01 a I-05, I-09, I-10), Ley 39/2015 (II-02, II-03, III-02, III-03), Ley 40/2015 (III-03, III-05), TREBEP (IV-01 a IV-06), Ley 19/2013 (I-07), LGP (V-01 a V-03) y documentación de Microsoft (VI-02, VI-04 a VI-07), más dos supuestos de 20 preguntas.
- [ ] Resto de temas: ver tabla del validador (temas sin preguntas auditadas).
- [ ] Bloque VI incompleto: faltan VI-01, VI-03 y VI-08 y hay 29 de las 30 preguntas de ofimática necesarias para un simulacro. Quedan 10 preguntas de la semilla pendientes y 7 retiradas (duplicadas o no verificables en la página vigente de Microsoft: historial del portapapeles de 25 entradas y borrado al reiniciar).
- [ ] Objetivo de 1.000+ auditadas: no se ha alcanzado ni se promete.
- Defecto conocido: en el banco auditado la opción correcta es la más larga en torno al 58 % de las preguntas (lo avisa el validador). `build_batch.py` ya rechaza lotes nuevos con más del 40 %; falta una pasada para alargar los distractores de los lotes anteriores.
- Corregidas dos preguntas del supuesto A que contradecían su narrativa (Q-CA-16 y Q-CA-18).
- Defecto de la semilla corregido: 0063 se contradecía; se reescribió.

## Fase 4 · Tests individuales
- [x] Selector por tema/bloque, 5/10/20/50/máximo, modo práctica y examen, sin repetición, barajado de preguntas y respuestas, blanco, marcar duda, volver, recuperar sesión.
- [x] Evitar preguntas recientes (opcional) y prioridad a fallos vencidos.

## Fase 5 · Simulacro
- [x] 40 teoría + 30 informática + elección de 1 entre 2 supuestos de 20, 100 minutos con reloj de pared, reservas separadas, penalización en tercios enteros, doble eliminatoria, cortes históricos 2025 (general y cupo 13), futuro sin corte (`null`).
- [x] Simulacro etiquetado "de entrenamiento con cobertura incompleta" mientras falten temas.
- [ ] Simulacro de cobertura completa: no posible hasta cubrir los 45 temas (y 30 preguntas de ofimática).

## Fase 6 · Aprendizaje
- [x] Historial, repaso espaciado (cajas 1/3/7/16/35 días), estadísticas por tema y evolución 7/30/90 días, racha y calendario.
- [x] Aviso explícito de que el progreso no se sincroniza entre dispositivos.

## Fase 7 · PWA y actualizaciones
- [x] Service worker (modo aviso), `version.json` con SHA de commit, banner de actualización que no recarga durante un examen.
- [ ] Prueba real de actualización sin pérdida de un examen en un navegador con la versión desplegada (pendiente de publicar el laboratorio).

## Fase 8 · GitHub y entornos
- [x] Workflow con verificación y dos sitios en un artefacto (`main` en `/`, `develop` en `/laboratorio/`).
- [ ] Repositorio creado y laboratorio desplegado: ver el informe final.
- [ ] Producción (`main`): **no publicada**; requiere aprobación expresa del propietario.

## Fase 9 · Calidad
- [x] Pruebas unitarias del motor (40/30/20, 100 min, un supuesto, barajado conserva la clave, tercios, doble eliminatoria, blanco, cortes históricos y futuro desconocido, filtro por auditoría, retiradas sin perder historial, persistencia).
- [x] Comprobación manual en navegador móvil (375 px) del flujo simulacro completo.
- [ ] Pruebas automáticas de UI a 390 y 320 px y en Safari iOS: no hechas.
- [ ] Auditoría de accesibilidad WCAG 2.2 AA: solo revisión básica (foco visible, objetivos de 44 px, roles); sin herramienta automática.
- [ ] Comprobación de enlaces automática: no hecha.
