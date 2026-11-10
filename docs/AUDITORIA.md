# Segunda evaluación a ciegas (noviembre de 2026)

**Esto es una segunda evaluación por IA, no una revisión humana independiente.** Los revisores son instancias de un modelo distinto del que redactó el banco, que trabajaron en una pasada separada, sin ver la respuesta marcada, y sus informes están en `audit/`. Siguen siendo modelos de lenguaje: pueden compartir sesgos con el redactor y no sustituyen a una persona con conocimiento jurídico.

## Método
1. **Muestra estratificada** (`scripts/audit-sample.py`, semilla 20261111): 120 preguntas del banco de entonces (1.006), 11,9 %. Estratos: bloque (I 22, II 12, III 28, IV 24, V 18, VI 16), tema (45 de 45, al menos 2 preguntas de teoría u ofimática por tema), fuente (32 fuentes distintas), tipo (74 teoría, 16 ofimática, 30 de supuestos) y complejidad (104 con datos numéricos o fechas, 16 conceptuales).
2. **Supuestos completos** (`scripts/audit-cases.py`): los 10 supuestos con las 250 preguntas (20 + 5 reservas cada uno). Los revisores debían mostrar el cómputo de cada plazo.
3. **Contenido nuevo de esta fase** (`scripts/audit-ids.py`): 188 preguntas (lotes de I-06, VI-01, VI-04, VI-06, VI-08, IV-06, I-04, V-01 a V-03 y los supuestos CASE-K, CASE-L y CASE-M) más 44 de los lotes finales (III-01, III-03, III-04, IV-05, II-01, II-02, VI-02, V-02).
4. A cada revisor se le dio: enunciado, cuatro opciones **barajadas sin marcar la correcta**, localizador, texto de la fuente (artículo del BOE o fragmento de página) y, en los supuestos, la narrativa. La clave se guardó fuera del repositorio y se comparó después (`scripts/audit-merge.py`; resultado en `audit/resultados.json`).
5. Cada revisor debía resolver la pregunta, valorar los tres distractores, comprobar fidelidad a la fuente y vigencia, y señalar defectos.
6. Los ficheros de entrada (`audit/*blind*.json`) llevan texto de páginas de terceros y no se publican (`.gitignore`).

## Resultado

| Conjunto | Revisadas | La respuesta del revisor coincide con la clave | ok | dudosas | error | con observaciones |
|---|---|---|---|---|---|---|
| Muestra estratificada | 120 | 120 | 120 | 0 | 0 | 25 |
| Supuestos (10) | 250 | 250 | 245 | 4 | 1 | 46 |
| Contenido nuevo | 188 | 188 | 186 | 2 | 0 | 20 |
| Lotes finales | 44 | 44 | 44 | 0 | 0 | 29 |

Dos advertencias para leer estos números: (a) los revisores veían el texto de la fuente, de modo que miden si la pregunta es fiel a ese texto, no si la fuente elegida era la adecuada; (b) una coincidencia del 100 % con la clave es coherente con un banco bien construido, pero también con revisores que comparten los sesgos del redactor. Por eso se dio peso a las observaciones y no solo al veredicto.

## Problemas encontrados y cómo se corrigieron (`data/audit-patches.json`, `scripts/apply_patches.py`)

**Error (1) y dudosas (4) en supuestos**
- **Q-CA-11 (error)**: el supuesto es una ayuda (subvención) y la Ley 38/2003 art. 25.5 ya prevé silencio desestimatorio; el enunciado se acotó para aislar la regla del art. 24.1 de la Ley 39/2015.
- **Q-CJ-16 (dudosa)**: la opción «el período se computa para las vacaciones» también era cierta (el art. 32.2 del Convenio computa el período «a todos los efectos»); se sustituyó.
- **Q-CJ-17 (dudosa, vigencia)**: el Convenio remite al RD 2720/1998, anterior al RDL 32/2021; se acotó el enunciado al texto del Convenio y se advirtió del régimen vigente en la explicación.
- **Q-CB-15 (dudosa)**: la narrativa decía «no hay más festivos» siendo el 8 de diciembre festivo nacional; se reformuló («no se tiene en cuenta ningún otro festivo»). El cómputo no cambia.
- **Q-CC-06 (dudosa)**: solo el extracto enviado al revisor estaba cortado; la pregunta y su cita eran correctas.

**Teoría y muestra (erratas y ambigüedades)**: Q-CE-20 (el enunciado decía «modificaciones previstas en el art. 205» siendo el 205 las no previstas), Q-IV04-005 (opción con «cuando» repetido y sin «por delito»), Q-IV04-009 (la explicación no advertía de la remisión del art. 67.4 al Régimen General), Q-III03-072 (no citaba la ley), Q-CD-10 (denominación ministerial de la LGP), Q-CG-01 (concordancia), Q-CA-16, Q-CG-19 y Q-CH-01 (el enunciado o una opción revelaba la respuesta de otra pregunta), Q-CH-09.

**Duplicados retirados (8)**: Q-I05-039, Q-I05-038, Q-I05-019, Q-V06-001, Q-V06-005, Q-III05-012, Q-VI03-009 y Q-VI01-010 repetían el hecho de otra pregunta. Se buscaron pares similares con coincidencia de la cita literal en todo el banco (21 coincidencias exactas, casi todas teoría↔supuesto, que el simulacro ya no junta).

**Contenido nuevo**: Q-CM-18 (edad de jubilación en 2026: la regla del art. 205.1.a convive con el régimen transitorio; se sustituyó por la carencia del art. 205.1.b), Q-V03-016 (una opción era parcialmente cierta), Q-CK-15 y Q-CL-19 (la narrativa revelaba la respuesta) y Q-VI01-025 (la página de Microsoft se contradice sobre las carpetas por defecto del Historial de archivos; retirada). Los revisores señalaron coletillas artificiosas en distractores que había añadido un procedimiento automático de equilibrado de longitud; se eliminaron todas.

## Búsqueda de casos similares
Tras cada hallazgo se buscaron preguntas con el mismo patrón: enunciados que citan una norma sin nombrarla, opciones que definen la respuesta de otra pregunta del mismo supuesto, y localizadores con artículo equivocado. Se corrigió además el validador para leer artículos titulados con palabras («Artículo sesenta y dos»).

## Límites que quedan
- Las preguntas corregidas después de la revisión (por ejemplo Q-CM-18 y los distractores de los lotes sin coletillas) no se volvieron a evaluar a ciegas.
- No se evaluó a ciegas el resto del banco (aproximadamente el 54 %); tiene la revisión de redacción y la validación automática.
- Sigue sin existir revisión humana independiente.
