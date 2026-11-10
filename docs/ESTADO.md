# Estado del proyecto

Última actualización: 2026-11-10 (fase final de calidad). Solo se marca `[x]` lo ejecutado y comprobado. Lo pendiente figura con su motivo. Las cifras del bloque siguiente las genera `scripts/update-cifras.mjs` y una prueba (`tests/docs.test.ts`) falla si dejan de coincidir con el banco.

## Cifras reales

<!-- CIFRAS:START (generado por scripts/update-cifras.mjs; no editar a mano) -->
- Preguntas auditadas: **1225** (710 de teoría, 193 de ofimática, 322 de supuestos).
- Supuestos completos (20 preguntas y 4-5 reservas cada uno): **13**.
- Temas con al menos una pregunta auditada de teoría u ofimática: **45/45**; mínimo por tema: **10**.

| Bloque | Preguntas auditadas de teoría u ofimática por tema |
|---|---|
| Bloque I | I-01 61 · I-02 16 · I-03 17 · I-04 22 · I-05 36 · I-06 25 · I-07 22 · I-08 27 · I-09 11 · I-10 13 · I-11 13 |
| Bloque II | II-01 18 · II-02 22 · II-03 17 · II-04 11 |
| Bloque III | III-01 20 · III-02 14 · III-03 90 · III-04 15 · III-05 11 · III-06 11 · III-07 16 |
| Bloque IV | IV-01 10 · IV-02 11 · IV-03 10 · IV-04 12 · IV-05 15 · IV-06 23 · IV-07 17 · IV-08 12 · IV-09 13 |
| Bloque V | V-01 18 · V-02 13 · V-03 17 · V-04 11 · V-05 10 · V-06 10 |
| Bloque VI (ofimática) | VI-01 26 · VI-02 15 · VI-03 11 · VI-04 31 · VI-05 37 · VI-06 30 · VI-07 13 · VI-08 30 |
<!-- CIFRAS:JSON {"auditadas":1225,"teoria":710,"ofimatica":193,"enSupuestos":322,"supuestos":13,"temas":45,"minimoPorTema":10} -->
<!-- CIFRAS:END -->

- Hay además 10 preguntas semilla pendientes de auditar y 18 retiradas (no cuentan en ningún examen; las retiradas en esta fase se conservan con estado «retirada» para no perder el historial del usuario).
- Verificación: cada pregunta pasa la validación automática (cita literal en la fuente guardada, hash del artículo, estructura, coherencia entre el artículo citado y la ancla). Todas fueron redactadas y comprobadas por Claude contra el texto oficial («revisión por IA»). **Además, 757 preguntas distintas han pasado por al menos una evaluación a ciegas por otros revisores IA; 707 de ellas siguen habilitadas (el 57,7 % del banco habilitado)** (recuento y definiciones en `docs/AUDITORIA.md`). **Revisión humana independiente: 0.**
- El objetivo de 1.000 preguntas auditadas se alcanzó y se supera (ver cifra de arriba).

### Supuestos (13)
CASE-A acto y procedimiento · CASE-B responsabilidad patrimonial · CASE-C personal funcionario · CASE-D presupuesto y gasto · CASE-E contratación · CASE-F protección de datos · CASE-G organización administrativa · CASE-H subvenciones · CASE-I igualdad · CASE-J personal laboral y Convenio único · **CASE-K retribuciones, nóminas e indemnizaciones** · **CASE-L atención al público (petición, quejas y sugerencias, cartas de servicios)** · **CASE-M Seguridad Social del personal laboral**. Un supuesto solo puede cubrir los bloques II a V del programa.

## Cobertura real del programa oficial (`docs/COBERTURA.md`)
La matriz `docs/COBERTURA.md` relaciona los 211 subapartados del programa con las preguntas de teoría y ofimática. Es una **heurística** de palabras comunes más una **valoración manual** (`data/cobertura-manual.json`). Hay 102 subapartados con ninguna o una sola coincidencia automática; se valoraron a mano 78 de ellos con este resultado: 39 cubiertos, 22 parciales, 15 pendientes y 2 solo en supuesto. Los otros 24 (con una coincidencia) no se revisaron uno a uno y los 109 restantes tienen dos o más coincidencias automáticas; ninguna de esas cifras es una prueba de cobertura. Pendientes principales, y por qué:
- **V-04 nóminas** (estructura y confección, altas y bajas, formas de pago): no hay norma primaria específica cargada; solo están las retribuciones (TREBEP) y las indemnizaciones (RD 462/2002).
- **VI-01/VI-02 conceptos de hardware, software, sistemas operativos y menú Inicio**: no hay fuente primaria legible con definiciones genéricas; se cubrieron los requisitos de Windows 11, almacenamiento, copias de seguridad, BitLocker y el Esquema Nacional de Seguridad.
- **II-01 atención a personas con discapacidad**, **II-03 páginas web públicas y ventanilla única empresarial**, **III-04 invalidez y recursos**, **IV-01 competencias en materia de personal**, **VI-03 búsqueda**, **VI-04 personalización**, **VI-05 configuración/personalización**, **VI-07 entorno y libreta de direcciones**: sin pregunta o sin fuente cargada. No se rellenan con contenido no verificable.

## Lagunas conocidas de la fase anterior: estado
- [x] I-06 Gobierno Abierto: 25 preguntas; ya no solo Agenda 2030. Fuentes: BOE-A-2026-9880 (Real Decreto 371/2026, Foro de Gobierno Abierto) y la Declaración de Gobierno Abierto de la OGP (la OGP ya respondió).
- [x] VI-01: 26 preguntas; antes solo Seguridad de Windows. Se añadieron ENS (RD 311/2022), requisitos de Windows 11, Sensor de almacenamiento, Historial de archivos y BitLocker.
- [x] VI-08: 30 preguntas; antes solo Edge. Se añadieron DNS y TCP/IP (Microsoft Learn), historia de la Web (CERN) y HTTP (RFC 9110, en inglés).
- [x] Word 365: de 18 a 31 (impresión, orientación, márgenes simétricos, listas). Access 365: de 13 a 30 (tipos de datos, formularios, informes, compactar y reparar, criterios y parámetros).
- [ ] Guardado y recuperación de documentos de Word: la página en español redirigía a una versión inglesa; no se añadió.

## Evaluaciones a ciegas por IA (resumen; detalle en `docs/AUDITORIA.md`)
- **Primera y segunda ronda**: muestra estratificada de 120 preguntas, los 10 supuestos iniciales (250) y el contenido nuevo (232). Ninguna clave resultó incorrecta; aparecieron 1 error y 4 dudosas en supuestos, erratas y 8 duplicados, todo corregido.
- **Ronda de estabilización** (esta fase): se reescribieron los distractores de 105 preguntas con sesgo de longitud y se evaluó de nuevo a ciegas todo lo modificado (122 preguntas) más una muestra nueva de 120 preguntas de materias complejas y plazos, y después las 34 corregidas tras esa evaluación. Resultado: las 276 evaluaciones coincidieron con la clave y no hubo errores jurídicos de fondo; hubo 5 dudosas (3 de ellas ya retiradas del supuesto y sustituidas por reservas), unas 19 explicaciones deficientes (corregidas) y varias observaciones de vigencia.
- Los revisores son modelos de lenguaje: **no sustituyen a una revisión humana independiente.**

## Verificaciones técnicas
- [x] 91 pruebas automáticas (lint, tipos, validador del banco y compilación también en verde). Nuevas en esta etapa: `tests/update.test.ts` (actualización sin perder historial), `tests/docs.test.ts` (cifras de la documentación = datos) y `tests/prodFilter.test.ts` (la compilación de producción solo lleva preguntas habilitadas y ningún campo interno). `scripts/check-history-compat.py` comprueba que ninguna corrección altera identificadores de opción ni la opción correcta (0 de 1.229 alteradas).
- [x] **Compilación de producción filtrada** (hallazgo de esta etapa): antes el paquete incluía todas las preguntas (también las 10 semilla sin verificar y las retiradas) y campos internos como `reviewerNotes`. Ahora `vite.config.ts` aplica `src/core/prodFilter.ts` en producción: 1.225 preguntas habilitadas (1.238 contando los 13 supuestos), ningún campo de auditoría y 1,4 MB frente a 1,9 MB del laboratorio. `scripts/check-dist.mjs` lo verifica y se ejecuta en el despliegue; se comprobó que falla si se cuela un campo interno.
- [x] `npm run pre-publicacion` (`scripts/pre-publicacion.mjs`) ejecuta todos los controles previos a publicar sobre el commit actual de develop y no publica nada. Procedimiento completo en `docs/PUBLICACION.md`; estado de decisión en `docs/DECISION_PRODUCCION.md`.
- [x] Accesibilidad en navegador real (axe-core, WCAG 2.2 AA y buenas prácticas) sobre las 9 rutas en tema claro y oscuro y una pantalla de sesión: se corrigieron un contraste insuficiente (2,16:1) en el botón «Borrar mis datos» en tema oscuro, las etiquetas del gráfico de estadísticas en tema claro (3,8:1, ahora 5,9:1) y un contenido fuera de puntos de referencia en el aviso de laboratorio. La auditoría WCAG manual completa (lectores de pantalla, teclado) no se ha hecho.
- [x] Persistencia, simulacro oficial y entrenamiento: sin cambios funcionales en esta fase; pruebas de iPhone anteriores siguen vigentes (los elementos de la interfaz modificados son solo estilos de contraste y un aviso).
- [x] Enlaces y vigencia: `npm run check:links` y `npm run check:vigencia`; los 35 textos del BOE guardados coinciden hoy con el BOE (ninguno cambió desde la auditoría).
- [ ] PWA con service worker: sigue sin poder probarse en el navegador integrado; solo comprobaciones estáticas y la prueba del propietario en iPhone.

## Riesgos pendientes
- Sin revisión humana independiente: las tres rondas de evaluación son de IA.
- El 42,3 % del banco habilitado no ha pasado por evaluación a ciegas (tiene redacción verificada contra la fuente y validación automática).
- Sesgo de longitud: tras reescribir 105 preguntas, la correcta es la opción más larga en el 22,7 % (azar: 25 %) y claramente más larga (≥ 25 %) en el 5,1 %, frente al 12,2 % anterior. Siguen algo por encima del azar CASE-A, CASE-B y CASE-L (45-55 % por diferencias de pocos caracteres; el sesgo claro es del 0-4 %). No se forzó el 25 % exacto.
- Vigencia: el IV Convenio único puede ser sustituido; Clases Pasivas está a extinguir (RDL 13/2010); la edad de jubilación de la LGSS tiene régimen transitorio; las páginas de Microsoft y Copilot cambian con frecuencia; las preguntas de HTTP y de la historia de la Web citan fuentes en inglés.
- Lagunas de contenido sin fuente primaria cargada (ver cobertura): nóminas (confección), hardware/software genérico, atención a personas con discapacidad, páginas web públicas, ventanilla única.
- PWA con service worker: sin probar en el navegador integrado (solo scripts y la prueba del propietario en iPhone).

## Publicación
- [x] Laboratorio en `develop`: https://losajr.github.io/oposiciones-administrativo-c1/laboratorio/
- [ ] Producción: no publicada ni fusionada (la PR 1 sigue abierta). Requiere la aprobación expresa del propietario.
