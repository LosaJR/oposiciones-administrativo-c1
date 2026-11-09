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
