"""Revision a ciegas del contenido NUEVO: todas las preguntas de los lotes indicados (bank-<lote>.json).
Genera audit/new-blind-N.json (sin marcar la correcta; con narrativa en las practicas y texto de la fuente) y escribe
la clave fuera del repositorio. Uso: python -I scripts/audit-ids.py <ruta-clave.json> <n-agentes> <lote> [<lote> ...]
"""
import io, json, pathlib, random, sys

base = pathlib.Path(__file__).resolve().parents[1]
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
keypath, nag, batches = pathlib.Path(sys.argv[1]), int(sys.argv[2]), sys.argv[3:]
rnd = random.Random(99)
cases = {c['id']: c for c in json.loads((base / 'data/cases.json').read_text(encoding='utf-8'))}
qs = []
for b in batches:
    qs += json.loads((base / 'data/questions' / f'bank-{b}.json').read_text(encoding='utf-8'))


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


items, key = [], {}
for q in qs:
    opts = q['options'][:]
    rnd.shuffle(opts)
    it = {'id': q['id'], 'tipo': q['kind'], 'tema': q['topic'], 'enunciado': q['stem'],
          'opciones': {'ABCD'[k]: o['text'] for k, o in enumerate(opts)}, 'fuente': q['source']['locator'], 'texto_fuente': source_text(q)}
    if q.get('caseId'):
        it['supuesto'] = q['caseId']
    items.append(it)
    key[q['id']] = {'correcta': next('ABCD'[k] for k, o in enumerate(opts) if o['id'] == q['correctOptionId']), 'explicacion': q.get('explanation', '')}
size = -(-len(items) // nag)
for n in range(nag):
    chunk = items[n * size:(n + 1) * size]
    narr = {c: cases[c]['narrative'] for c in {i['supuesto'] for i in chunk if 'supuesto' in i}}
    (base / 'audit' / f'new-blind-{n + 1}.json').write_text(json.dumps({'narrativas': narr, 'preguntas': chunk}, ensure_ascii=False, indent=1), encoding='utf-8')
keypath.write_text(json.dumps(key, ensure_ascii=False, indent=1), encoding='utf-8')
print(len(items), 'preguntas en', nag, 'ficheros')
