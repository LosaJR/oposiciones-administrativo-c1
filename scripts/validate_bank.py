import json, pathlib, collections, sys, re
base=pathlib.Path(__file__).resolve().parents[1]
qs=json.loads((base/'data/questions.seed.json').read_text(encoding='utf-8'))
cs=json.loads((base/'data/cases.seed.json').read_text(encoding='utf-8'))
topics=json.loads((base/'data/syllabus-2025.json').read_text(encoding='utf-8'))
config=json.loads((base/'config/exam-2025.json').read_text(encoding='utf-8'))
seen=set(); stems=set(); errs=[]; allowed={t['code'] for t in topics}
for q in qs:
    key=q.get('id')
    if key in seen:errs.append(f'ID repetido {key}')
    seen.add(key)
    st=re.sub(r'\s+',' ',q['stem'].lower()).strip()
    if st in stems:errs.append(f'Enunciado duplicado {key}')
    stems.add(st)
    opts=q['options']
    if len(opts)!=4 or len(set(o['text'].lower().strip() for o in opts))!=4:errs.append(f'Opciones inválidas {key}')
    if q['correctOptionId'] not in {o['id'] for o in opts}:errs.append(f'Respuesta inexistente {key}')
    if q['topic'] not in allowed:errs.append(f'Tema fuera de programa {key}')
    if not q['source']['url'].startswith('https://'):errs.append(f'Sin URL de fuente {key}')
    if not q['source']['locator']:errs.append(f'Sin localizador (artículo, sección) {key}')
    if q['review_status'] not in {'source_linked_pending_individual_audit','audited_current','retired'}:errs.append(f'Estado de revisión inválido {key}')
    if q['block'] not in {'theory','office','practical'}:errs.append(f'Bloque inválido {key}')
caseids={c['id'] for c in cs}
for c in cs:
    if len(c['question_ids'])!=20:errs.append(f'Caso {c["id"]} no tiene 20 preguntas')
    for id in c['question_ids']:
        x=next((a for a in qs if a['id']==id),None)
        if not x or x['case_id']!=c['id'] or x['block']!='practical':errs.append(f'Pregunta de caso inconsistente {id}')
counts=collections.Counter(q['block'] for q in qs)
for b,n in [('theory',40),('office',30),('practical',40)]:
    if counts[b]<n:errs.append(f'Insuficientes preguntas {b}: {counts[b]} de {n}')
coverage=len({q['topic'] for q in qs}); missing=sorted(allowed-{q['topic'] for q in qs})
print(f"Preguntas fuente-vinculadas: {len(qs)}. Reparto: {dict(counts)}. Casos: {len(cs)}. Temas cubiertos: {coverage}/45")
print('Temas SIN preguntas de arranque:',', '.join(missing))
print('Estado de auditoría:',dict(collections.Counter(q['review_status'] for q in qs)))
print('IMPORTANTE: los tests estructurales NO sustituyen auditoría jurídica/manual contra fuente.')
print('SIMULACRO OFICIAL NO HABILITABLE hasta obtener cobertura de todos los temas, revisión individual y criterios actuales.')
if errs:
    print('ERRORES:\n'+'\n'.join(errs));sys.exit(1)
print('OK: estructura, unicidad, cuotas mínimas y referencias presentes.')
