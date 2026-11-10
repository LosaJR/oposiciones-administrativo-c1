# Niveles de verificación del banco

Un fragmento literal del BOE en la explicación **no demuestra por sí solo que la pregunta sea correcta**: demuestra que la regla citada existe. Por eso se separan tres niveles y no se mezclan.

## 1. Validación automática (`npm run validate`, se ejecuta en CI)
Comprueba, sin interpretar:
- Estructura: 4 opciones distintas, respuesta existente, tema del programa, tipo coherente con el bloque, 20 preguntas por supuesto, reservas del supuesto.
- La cita (`evidenceQuote`) aparece **literal** en el artículo cacheado o, para páginas de terceros, entre los fragmentos guardados; el hash del artículo no ha cambiado desde la auditoría (si cambia, hay que reauditar).
- El artículo citado en el localizador coincide con el bloque de la caché.
- La norma no figura derogada; el estado y los campos de auditoría están completos.
- Estadística: sesgo de longitud (falla por encima del 50 %), posición de la correcta, palabras absolutas, hechos repetidos.
No puede comprobar: ambigüedad del enunciado, falsedad inequívoca de cada distractor, ni que la explicación respalde de verdad la respuesta.

## 2. Revisión por IA (`reviewer: claude-source-check`)
Claude redactó cada pregunta a partir del texto oficial que leyó, verificó la respuesta correcta y la falsedad de los distractores frente a ese texto y, en los supuestos, comprobó los cómputos de fechas con un calendario. No es una segunda opinión independiente: es la misma fuente de errores que la redacción. Los cálculos de plazos de los supuestos están marcados en `reviewerNotes`.

## 3. Revisión humana independiente
**No se ha realizado ninguna.** Hasta que una persona con conocimiento jurídico revise el banco, `reviewer` no debe sustituirse por un nombre humano. Cuando exista, se registrará como un campo distinto (no se reutiliza `claude-source-check`).

## Qué hacer con una pregunta que no supera las comprobaciones
Se mantiene fuera de los exámenes: `reviewStatus` distinto de `audited_current` (`stale`, `retired` o pendiente) y solo `audited_current` se habilita en producción. Una pregunta con la norma modificada pasa a `stale` y se conserva en el historial del usuario.

## Estadística del banco (2026-11-10, 1.006 preguntas auditadas)
- La respuesta correcta es la opción estrictamente más larga en el **24,3 %** (azar: 25 %; antes de corregir: ~59 %). `build_batch.py` rechaza lotes nuevos por encima del 40 %.
- Posición de la correcta: A 26,1 %, B 24,9 %, C 25,0 %, D 24,0 %.
- Palabras absolutas (siempre, nunca, solo, únicamente, todos…): 3,3 % de las correctas y 4,7 % de los distractores, tras reescribir distractores en 2026-11-10. El validador y `tests/quality.test.ts` fallan si la razón supera 1,8 en cualquier sentido.

## Revisión de los distractores modificados (P4)
Las 42 preguntas a las que se alargó un distractor para corregir el sesgo de longitud se releyeron una a una frente a su fuente (los números de pregunta están en el historial de git, commits de la fase 4 y 5). Criterios: el distractor es inequívocamente falso, no es parcialmente correcto, no repite a otro distractor ni deja una pista estructural. Resultado: un distractor casi duplicado corregido (Q-CA-11); el resto se mantuvo. Es una relectura por IA, **no** una revisión humana independiente.

## Duplicidades entre teoría y supuestos
Los supuestos reutilizan reglas que también están en la teoría. El simulacro no junta preguntas con el mismo `fact` en una misma sesión (hay un aviso del validador por cada coincidencia). Al incorporar los supuestos de esta fase se detectaron y descartaron 5 preguntas de lotes nuevos que repetían exactamente el contenido de otra ya auditada (mismo artículo y misma regla): conviene repetir esta comprobación al añadir lotes.

## Limitaciones conocidas
- Las páginas de Microsoft Support se guardan como fragmentos citados, no como texto completo, y pueden cambiar; si una página se rehace, la cita deja de verificarse y la pregunta debe reauditarse.
- Un lote de preguntas de la Unión Europea (EUR-Lex) no se puede volver a descargar automáticamente (la página devuelve contenido vacío): su verificación se apoya en los extractos guardados (`data/source-excerpts/web.json`). `scripts/make_excerpts.py` conserva esos extractos cuando no hay copia local utilizable.
- Gobierno Abierto (I-06) no tiene fuente oficial legible: las preguntas cubren solo la Agenda 2030.
