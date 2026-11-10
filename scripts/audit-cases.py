"""Prepara la revision a ciegas COMPLETA de los supuestos (todas las preguntas, reservas incluidas).
Genera audit/cases-blind-N.json (N = 1..5, dos supuestos cada uno) con la narrativa, el enunciado, las cuatro opciones
barajadas SIN marcar la correcta y el texto de la fuente. La clave se escribe fuera del repositorio (ruta en argv[1]).
Uso: python -I scripts/audit-cases.py <ruta-clave.json> [semilla]
"""
import glob, io, json, pathlib, random, sys

base = pathlib.Path(__file__).resolve().parents[1]
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
keypath = pathlib.Path(sys.argv[1])
rnd = random.Random(int(sys.argv[2]) if len(sys.argv) > 2 else 7)
Q = {}
for f in glob.glob(str(base / 'data/questions/bank-*.json')):
    for q in json.loads(pathlib.Path(f).read_text(encoding='utf-8')):
        if q['reviewStatus'] == 'audited_current':
            Q[q['id']] = q
cases = sorted(json.loads((base / 'data/cases.json').read_text(encoding='utf-8')), key=lambda c: c['id'])


def source_text(q):
    s = q['source']
    p = base / 'data' / 'source-cache' / f"{s['cacheKey']}.json"
    quote = q.get('evidenceQuote', '')
    if p.exists():
        d = json.loads(p.read_text(encoding='utf-8'))
        an = s.get('anchor')
        an = an if isinstance(an, str) else (an or [''])[0]
        a = d['articles'].get(an)
        txt = a['text'] if isinstance(a, dict) else ''
        if len(txt) > 4500 and quote:
            i = max(0, txt.find(quote[:40]) - 1500)
            txt = txt[i:i + 4000]
        return txt[:4500]
    ex = json.loads((base / 'data/source-excerpts/web.json').read_text(encoding='utf-8')).get(s['cacheKey'], {})
    return ' [...] '.join(ex.get('excerpts', []))[:4000]


key, groups = {}, []
for i in range(0, len(cases), 2):
    items = []
    narr = {c['id']: c['narrative'] for c in cases[i:i + 2]}
    for c in cases[i:i + 2]:
        ids = list(c['questionIds']) + list(c.get('reserveQuestionIds', []))
        for qid in ids:
            q = Q[qid]
            opts = q['options'][:]
            rnd.shuffle(opts)
            items.append({'id': qid, 'supuesto': c['id'], 'enunciado': q['stem'],
                          'opciones': {'ABCD'[k]: o['text'] for k, o in enumerate(opts)},
                          'fuente': q['source']['locator'], 'texto_fuente': source_text(q)})
            key[qid] = {'correcta': next('ABCD'[k] for k, o in enumerate(opts) if o['id'] == q['correctOptionId']),
                        'explicacion': q.get('explanation', '')}
    groups.append({'narrativas': narr, 'preguntas': items})
out = base / 'audit'
for n, g in enumerate(groups, 1):
    (out / f'cases-blind-{n}.json').write_text(json.dumps(g, ensure_ascii=False, indent=1), encoding='utf-8')
keypath.write_text(json.dumps(key, ensure_ascii=False, indent=1), encoding='utf-8')
print({n: len(g['preguntas']) for n, g in enumerate(groups, 1)})
