"""Retira preguntas pendientes de la semilla (duplicadas o no verificables) sin borrarlas.
Uso: python scripts/retire_seeds.py "<motivo>" 0045 0056 ...    (ids cortos o completos)
Quedan en data/questions/retired.json con reviewStatus=retired y el motivo; no se muestran ni cuentan.
"""
import io, json, pathlib, sys, time

BASE = pathlib.Path(__file__).resolve().parents[1]
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
reason, ids = sys.argv[1], sys.argv[2:]
full = {i if i.startswith('AGE-') else f'AGE-C1-SEED-{int(i):04d}' for i in ids}
pend_path = BASE / 'data/questions/pending-seed.json'
ret_path = BASE / 'data/questions/retired.json'
pend = json.loads(pend_path.read_text(encoding='utf-8'))
ret = json.loads(ret_path.read_text(encoding='utf-8')) if ret_path.exists() else []
keep, moved = [], 0
for q in pend:
    if q['id'] in full:
        q = {**q, 'reviewStatus': 'retired', 'reviewedAt': time.strftime('%Y-%m-%d'), 'reviewer': 'claude-source-check', 'reviewerNotes': reason}
        ret.append(q)
        moved += 1
    else:
        keep.append(q)
pend_path.write_text(json.dumps(keep, ensure_ascii=False, indent=1), encoding='utf-8')
ret_path.write_text(json.dumps(ret, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'retiradas {moved}; pendientes {len(keep)}')
