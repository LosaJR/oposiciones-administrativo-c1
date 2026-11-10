# Estado del proyecto

Última actualización: 2026-11-10 (fase final de calidad). Solo se marca `[x]` lo ejecutado y comprobado. Lo pendiente figura con su motivo. Las cifras del bloque siguiente las genera `scripts/update-cifras.mjs` y una prueba (`tests/docs.test.ts`) falla si dejan de coincidir con el banco.

## Cifras reales

<!-- CIFRAS:START (generado por scripts/update-cifras.mjs; no editar a mano) -->
- Preguntas auditadas: **1229** (711 de teoría, 193 de ofimática, 325 de supuestos).
- Supuestos completos (20 preguntas + 5 reservas): **13**.
- Temas con al menos una pregunta auditada de teoría u ofimática: **45/45**; mínimo por tema: **10**.

| Bloque | Preguntas auditadas de teoría u ofimática por tema |
|---|---|
| Bloque I | I-01 61 · I-02 16 · I-03 17 · I-04 22 · I-05 36 · I-06 25 · I-07 22 · I-08 27 · I-09 11 · I-10 13 · I-11 13 |
| Bloque II | II-01 18 · II-02 22 · II-03 17 · II-04 11 |
| Bloque III | III-01 20 · III-02 14 · III-03 90 · III-04 15 · III-05 11 · III-06 11 · III-07 16 |
| Bloque IV | IV-01 10 · IV-02 11 · IV-03 10 · IV-04 12 · IV-05 16 · IV-06 23 · IV-07 17 · IV-08 12 · IV-09 13 |
| Bloque V | V-01 18 · V-02 13 · V-03 17 · V-04 11 · V-05 10 · V-06 10 |
| Bloque VI (ofimática) | VI-01 26 · VI-02 15 · VI-03 11 · VI-04 31 · VI-05 37 · VI-06 30 · VI-07 13 · VI-08 30 |
<!-- CIFRAS:JSON {"auditadas":1229,"teoria":711,"ofimatica":193,"enSupuestos":325,"supuestos":13,"temas":45,"minimoPorTema":10} -->
<!-- CIFRAS:END -->

- Hay además 10 preguntas semilla pendientes de auditar y 7 retiradas (no cuentan en ningún examen).
- Verificación: cada pregunta pasa la validación automática (cita literal en la fuente guardada, hash del artículo, estructura, coherencia entre el artículo citado y la ancla). Todas fueron redactadas y comprobadas por Claude contra el texto oficial («revisión por IA»). **Además, 572 preguntas distintas han pasado por una segunda evaluación a ciegas por otros revisores IA** (ver `docs/AUDITORIA.md`). **Revisión humana independiente: 0.**
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

## Segunda evaluación independiente (resumen; detalle en `docs/AUDITORIA.md`)
- Muestra estratificada de 120 preguntas (11,9 % del banco de entonces) y los 10 supuestos completos (250 preguntas), más todo el contenido nuevo de esta fase. Los revisores recibieron el enunciado, las opciones barajadas **sin marcar la correcta** y el texto de la fuente.
- Ninguna respuesta de la clave resultó incorrecta en la muestra; sí aparecieron **1 error y 4 dudosas en supuestos** (ya corregidos), 5 erratas o ambigüedades en teoría, 8 duplicados retirados y un problema de vigencia (régimen de contratación temporal del Convenio). El resultado **no** es una revisión humana independiente.

## Verificaciones técnicas
- [x] 87 pruebas automáticas, validador del banco y compilación en CI. Nuevas: `tests/update.test.ts` (actualización sin perder historial) y `tests/docs.test.ts` (cifras de la documentación = banco).
- [x] Accesibilidad en navegador real (axe-core con contraste) sobre las 9 rutas en tema oscuro: se detectó y corrigió un contraste insuficiente (2,16:1) en el botón «Borrar mis datos» y un contenido fuera de puntos de referencia en el aviso de laboratorio. Pendiente repetir en tema claro y con WCAG 2.2 completo.
- [x] Persistencia, simulacro oficial y entrenamiento: sin cambios funcionales en esta fase; pruebas de iPhone anteriores siguen vigentes (los elementos de la interfaz modificados son solo estilos de contraste y un aviso).
- [x] Enlaces y vigencia: `npm run check:links` y `npm run check:vigencia`; los 28 textos del BOE guardados coinciden hoy con el BOE (ninguno cambió desde la auditoría).
- [ ] PWA con service worker: sigue sin poder probarse en el navegador integrado; solo comprobaciones estáticas y la prueba del propietario en iPhone.

## Riesgos pendientes
- Sin revisión humana independiente: las dos evaluaciones son de IA.
- En unas 100 preguntas nuevas (lotes CASE-L, CASE-M, gap6 y gap7) la respuesta correcta tiende a ser la opción más larga, porque se reproduce la redacción literal de la norma; el global del banco está por debajo del 40 % exigido, pero convendría reescribir distractores con contenido real.
- Las páginas de Microsoft y la aplicación Copilot cambian con frecuencia.
- La LGSS (edad de jubilación) tiene un régimen transitorio hasta 2027; se evitó preguntar la edad concreta.

## Publicación
- [x] Laboratorio en `develop`: https://losajr.github.io/oposiciones-administrativo-c1/laboratorio/
- [ ] Producción: no publicada ni fusionada (la PR 1 sigue abierta). Requiere la aprobación expresa del propietario.
