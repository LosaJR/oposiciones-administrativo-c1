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

# Ronda de estabilización (noviembre de 2026)

Objetivo: corregir el sesgo de longitud **sin sacrificar la exactitud jurídica** y volver a evaluar a ciegas todo lo modificado, más una muestra nueva. Sigue siendo una evaluación por IA, no una revisión humana independiente.

## 1. Corrección de distractores (`data/distractor-patches.json`)
- 105 preguntas con distractores demasiado cortos o con coletillas artificiales se corrigieron una a una (CASE-L, CASE-M, lotes gap6 y gap7, y lotes anteriores con sesgo: casers, l19, lgp1, l40a, tre1, ce4, l39a, f2a, casea y caseb). Los distractores nuevos añaden contenido (condiciones, órganos o consecuencias falsos y relacionados), no relleno. No se alteró ninguna respuesta correcta, ni su posición ni los identificadores de opción: `scripts/check-history-compat.py` lo comprueba (1.229 preguntas comparadas con la versión anterior, 0 alteradas).
- Sesgo de longitud (la correcta es la opción más larga): global 26,7 % → 22,7 %; «claro» (la correcta mide ≥ 25 % más que el distractor más largo): 12,2 % → 5,1 % (`audit/sesgo-longitud.json`, `scripts/bias-report.py`). Por lote, antes → después (estricto / claro): CASE-M 60 % → 24 % / 48 % → 0 %; CASE-L 68 % → 48 % / 44 % → 4 %; gap6 70 % → 38 % / 38 % → 3 %; gap7 75 % → 41 % / 58 % → 0 %; ce4 36 % → 4 % / 36 % → 0 %; lgp1 77 % → 69 % / 46 % → 15 %; l19 82 % → 64 % / 45 % → 9 %; tre1 50 % → 35 % / 40 % → 10 %. Por supuesto: CASE-L 68 % → 48 %, CASE-M 60 % → 24 %, CASE-A 64 % → 54 %, CASE-B 60 % → 58 % (en estos tres el sesgo claro es de 0-4 %: la diferencia es de pocos caracteres). No se forzó el 25 % exacto.

## 2. Nueva evaluación a ciegas (`audit/mod-*`, `audit/m2-*`, `audit/r3-*`)
- Dos etapas por revisor: (1) a ciegas, sin respuesta marcada y sin la explicación; (2) solo después, evaluación de la explicación y su fundamento normativo.
- **122 preguntas modificadas** (incluidas Q-CM-18 y todas las alteradas tras la evaluación anterior): 118 ok, 4 dudosas, 0 errores; 12 explicaciones deficientes.
- **Muestra nueva de 120** preguntas de teoría y ofimática que nunca habían sido evaluadas, priorizando cálculos de plazos y materias complejas (51 de bloque III y 22 de bloque IV, entre otras): 119 ok, 1 dudosa, 0 errores; 6 explicaciones deficientes.
- **34 correcciones posteriores**: 34 ok, 0 dudosas, 0 errores; 1 explicación deficiente (corregida).
- En total 276 evaluaciones en esta ronda, todas coincidentes con la clave. Con las rondas anteriores, 757 preguntas distintas han sido evaluadas a ciegas (707 siguen habilitadas, el 57,7 %).

## 3. Errores jurídicos y de redacción encontrados y solucionados (`data/review3-patches.json`)
- **Retiradas del supuesto y sustituidas por una reserva** (se conservan como «retiradas» para el historial): Q-CA-11 (premisa irreal: el art. 25.5 de la Ley 38/2003 ya fija el silencio desestimatorio en subvenciones), Q-CJ-17 (régimen de contratación temporal del Convenio anterior al RDL 32/2021) y Q-CB-15 (es discutible que la prórroga del art. 30.5 se aplique al plazo máximo para resolver; la opción del sábado era defendible). Q-IV05-018 se retiró por duplicar Q-IV05-002.
- **Opciones parcialmente defendibles reemplazadas**: Q-CE-20 (el art. 206 LCSP hacía defendible «solo si el contratista se opone»), Q-IV04-009 (los 67 años del art. 67.4 TREBEP), Q-III03-032 (art. 121.2), Q-CK-15 (delegación del Subsecretario) y otras.
- **Explicaciones corregidas o completadas (19)**: entre otras, Q-III06-003 (el art. 36.2 obliga a exigir de oficio la responsabilidad al personal con dolo, culpa o negligencia graves; decía «puede»), Q-V04-011 (cita y localizador apuntaban al art. 23.a en vez del 23.b), Q-II03-002, Q-III03-011, Q-III03-024, Q-III01-011, Q-V03-010, Q-IV07-006 (Clases Pasivas está a extinguir desde el RDL 13/2010) y Q-III05-001 (contenía una nota interna).
- **Enunciados y opciones**: 8 enunciados sin la ley citada, una opción mal formada (Q-I01-023), un error gramatical (Q-IV02-006), absolutos que delataban distractores (Q-III03-054, Q-III03-082) y dos reservas sin relación con la narrativa (Q-CM-R1, Q-CL-R4).
- **Cambio de política**: las preguntas retiradas ya no se borran, pasan a `reviewStatus: retired` y se restauraron como tales las 11 que se habían borrado antes y estaban en el banco que se probó en el laboratorio. `scripts/build_batch.py` conserva las retiradas al reconstruir un lote.

## 4. Observaciones aceptadas sin cambio
Distractores «incompletos pero no falsos» (p. ej. Q-III03-040 opción incompleta, Q-IV06-001), preguntas cuya respuesta es la literal del artículo y la más larga por pocos caracteres, la advertencia jurisprudencial de Q-III03-111 (se limita a la literalidad del artículo y se avisa en la explicación) y las notas de vigencia (IV Convenio único, Copilot).

## Límites que persisten
- Revisión humana independiente: ninguna. Los revisores veían el texto de la fuente.
- El 42,3 % del banco habilitado no ha sido evaluado a ciegas.
- Las correcciones de las últimas horas se evaluaron a ciegas (34), salvo cuatro retoques de redacción menores posteriores (Q-V03-010, Q-CL-R4, Q-CE-20 y Q-III03-082).

