"""Convierte la semilla del kit al esquema propio. Todas quedan pendientes de auditoria."""
import io, json, pathlib

base = pathlib.Path(__file__).resolve().parents[1]
seed = json.loads((base / 'data/archive/questions.seed-original.json').read_text(encoding='utf-8'))
cases = json.loads((base / 'data/archive/cases.seed-original.json').read_text(encoding='utf-8'))
case_of = {qid: c['id'] for c in cases for qid in c['question_ids']}
KIND = {'theory': 'theory', 'office': 'office', 'practical': 'practical'}
out = []
for q in seed:
    kind = KIND[q['block']]
    out.append({
        'id': q['id'], 'version': 1, 'kind': kind, 'topic': q['topic'],
        **({'caseId': case_of[q['id']]} if q['id'] in case_of else {}),
        'stem': q['stem'], 'options': q['options'], 'correctOptionId': q['correctOptionId'],
        'explanation': 'Explicación pendiente de auditoría.',
        'source': {'url': q['source']['url'], 'locator': q['source']['locator']},
        'reviewStatus': 'source_linked_pending_individual_audit',
    })
(base / 'data/questions/pending-seed.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
print(len(out))
