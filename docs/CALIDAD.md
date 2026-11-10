# Niveles de verificación del banco

Un fragmento literal del BOE en la explicación **no demuestra por sí solo que la pregunta sea correcta**: demuestra que la regla citada existe. Por eso se separan tres niveles y no se mezclan.

## 1. Validación automática (`npm run validate`, se ejecuta en CI)
Comprueba, sin interpretar:
- Estructura: 4 opciones distintas, respuesta existente, tema del programa, tipo coherente con el bloque, 20 preguntas por supuesto, reservas del supuesto.
- La cita (`evidenceQuote`) aparece **literal** en el artículo cacheado o, para páginas de terceros, entre los fragmentos guardados; el hash del artículo no ha cambiado desde la auditoría (si cambia, hay que reauditar).
- El artículo citado en el localizador coincide con el bloque de la caché.
- La norma no figura derogada; el estado y los campos de auditoría están completos.
- Estadística: sesgo de longitud (falla por encima del 40 % en el banco completo), posición de la correcta, palabras absolutas, hechos repetidos y casi duplicados.
- Documentación: `tests/docs.test.ts` falla si las cifras de `docs/ESTADO.md` no coinciden con el banco o reaparecen cifras antiguas.
No puede comprobar: ambigüedad del enunciado, falsedad inequívoca de cada distractor, ni que la explicación respalde de verdad la respuesta.

## 2. Revisión por IA (`reviewer: claude-source-check`)
Hay dos pasadas de IA, ambas **sin** revisión humana: la de redacción (esta sección) y la segunda evaluación a ciegas por otros revisores (`docs/AUDITORIA.md`, `audit/resultados.json`).

Claude redactó cada pregunta a partir del texto oficial que leyó, verificó la respuesta correcta y la falsedad de los distractores frente a ese texto y, en los supuestos, comprobó los cómputos de fechas con un calendario. No es una segunda opinión independiente: es la misma fuente de errores que la redacción. Los cálculos de plazos de los supuestos están marcados en `reviewerNotes`.

## 3. Revisión humana independiente
**No se ha realizado ninguna.** Hasta que una persona con conocimiento jurídico revise el banco, `reviewer` no debe sustituirse por un nombre humano. Cuando exista, se registrará como un campo distinto (no se reutiliza `claude-source-check`).

## Qué hacer con una pregunta que no supera las comprobaciones
Se mantiene fuera de los exámenes: `reviewStatus` distinto de `audited_current` (`stale`, `retired` o pendiente) y solo `audited_current` se habilita en producción. Una pregunta con la norma modificada pasa a `stale` y se conserva en el historial del usuario.

## Estadística del banco (2026-11-10, 1.229 preguntas auditadas)
- La respuesta correcta es la opción estrictamente más larga en el **26,6 %** (azar: 25 %). `build_batch.py` rechaza lotes nuevos con más del 80 % (límite por lote relajado en esta fase; el límite global del 40 % lo vigila `tests/quality.test.ts`).
- Excepción conocida: en unas 100 preguntas nuevas (CASE-L, CASE-M, lotes gap6 y gap7) la correcta es la más larga entre el 64 % y el 75 % de las veces, porque reproducen la frase literal de la norma. Se descartó el equilibrado automático con coletillas porque los revisores lo detectaron como artificioso. Pendiente: reescribir distractores con contenido real.
- Posición de la correcta: A 25 %, B 25 %, C 24 %, D 25 %.
- Palabras absolutas: la razón se mantiene por debajo de 1,8 (prueba automática).

## Revisión de los distractores modificados (P4)
Las 42 preguntas a las que se alargó un distractor para corregir el sesgo de longitud se releyeron una a una frente a su fuente (los números de pregunta están en el historial de git, commits de la fase 4 y 5). Criterios: el distractor es inequívocamente falso, no es parcialmente correcto, no repite a otro distractor ni deja una pista estructural. Resultado: un distractor casi duplicado corregido (Q-CA-11); el resto se mantuvo. Es una relectura por IA, **no** una revisión humana independiente.

## Duplicidades entre teoría y supuestos
Los supuestos reutilizan reglas que también están en la teoría. El simulacro no junta preguntas con el mismo `fact` en una misma sesión (hay un aviso del validador por cada coincidencia). Al incorporar los supuestos de esta fase se detectaron y descartaron 5 preguntas de lotes nuevos que repetían exactamente el contenido de otra ya auditada (mismo artículo y misma regla): conviene repetir esta comprobación al añadir lotes.

## Limitaciones conocidas
- Las páginas de Microsoft Support se guardan como fragmentos citados, no como texto completo, y pueden cambiar; si una página se rehace, la cita deja de verificarse y la pregunta debe reauditarse.
- Un lote de preguntas de la Unión Europea (EUR-Lex) no se puede volver a descargar automáticamente (la página devuelve contenido vacío): su verificación se apoya en los extractos guardados (`data/source-excerpts/web.json`). `scripts/make_excerpts.py` conserva esos extractos cuando no hay copia local utilizable.
- Gobierno Abierto (I-06): ya cubierto con el Real Decreto 371/2026 (BOE) y la Declaración de la OGP; no se localizó el texto del V Plan de Gobierno Abierto (el portal de transparencia falló por certificado).
- Las preguntas de HTTP citan el RFC 9110 en inglés; las de la historia de la Web, la página del CERN en inglés.
- Páginas con contradicciones internas (p. ej. Historial de archivos de Windows) se descartan.
