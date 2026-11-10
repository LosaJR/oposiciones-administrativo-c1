"""Registra (o actualiza) un supuesto en data/cases.json a partir de su borrador y su .meta.json.
Uso: python -I scripts/register_case.py <letra>     (p. ej. k  ->  data/drafts/casek.json + casek.meta.json, id CASE-K)
Las 20 primeras preguntas (Q-C?-NN) son las del supuesto y las cinco Q-C?-Rn, las reservas. Debe haberse ejecutado antes
`python scripts/build_batch.py case<letra>` (las preguntas tienen que existir y estar auditadas).
"""
import io, json, pathlib, sys

base = pathlib.Path(__file__).resolve().parents[1]
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
letter = sys.argv[1].lower()
meta = json.loads((base / 'data/drafts' / f'case{letter}.meta.json').read_text(encoding='utf-8'))
drafts = json.loads((base / 'data/drafts' / f'case{letter}.json').read_text(encoding='utf-8'))
cid = f'CASE-{letter.upper()}'
entry = {'id': cid, 'title': meta['title'], 'narrative': meta['narrative'], 'topics': meta['topics'],
         'questionIds': [d['id'] for d in drafts if '-R' not in d['id']],
         'sources': meta['sources'], 'reviewStatus': 'audited_current',
         'reserveQuestionIds': [d['id'] for d in drafts if '-R' in d['id']]}
path = base / 'data' / 'cases.json'
cases = json.loads(path.read_text(encoding='utf-8'))
cases = [c for c in cases if c['id'] != cid] + [entry]
cases.sort(key=lambda c: c['id'])
path.write_text(json.dumps(cases, ensure_ascii=False, indent=2), encoding='utf-8')
print(cid, len(entry['questionIds']), 'preguntas +', len(entry['reserveQuestionIds']), 'reservas;', len(cases), 'supuestos en total')
