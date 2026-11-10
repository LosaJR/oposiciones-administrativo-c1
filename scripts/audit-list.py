"""Revision a ciegas de una lista de preguntas (por identificador).
Modos:
  modificadas  -> las corregidas tras la primera evaluacion (data/audit-patches.json + data/distractor-patches.json + extras)
  muestra      -> muestra estratificada de preguntas de teoria/ofimatica que NUNCA han pasado por una evaluacion a ciegas,
                  priorizando calculos de plazos y materias complejas
Genera audit/<prefijo>-blind-N.json (sin marcar la correcta; con narrativa en las practicas y texto de la fuente) y escribe
la clave fuera del repositorio. Uso: python -I scripts/audit-list.py <modo> <ruta-clave.json> <n-agentes> <prefijo> [semilla]
"""
import glob, io, json, pathlib, random, re, sys

base = pathlib.Path(__file__).resolve().parents[1]
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
mode, keypath, nag, prefix = sys.argv[1], pathlib.Path(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
rnd = random.Random(int(sys.argv[5]) if len(sys.argv) > 5 else 20261112)
Q = {}
for f in glob.glob(str(base / 'data/questions/bank-*.json')):
    for q in json.loads(pathlib.Path(f).read_text(encoding='utf-8')):
        if q['reviewStatus'] == 'audited_current':
            Q[q['id']] = q
cases = {c['id']: c for c in json.loads((base / 'data/cases.json').read_text(encoding='utf-8'))}
EXTRA = ['Q-CM-18', 'Q-CK-15', 'Q-CL-19', 'Q-CB-15']  # cambios de enunciado o narrativa posteriores a su revision


def patched():
    ids = set(EXTRA)
    for name in ('audit-patches.json', 'distractor-patches.json'):
        p = base / 'data' / name
        if p.exists():
            ids |= set(json.loads(p.read_text(encoding='utf-8')).get('edit', {}))
    return sorted(i for i in ids if i in Q)


def reviewed_blind():
    ids = set()
    for pat in ('result-[0-9].json', 'result-cases-[0-9].json', 'new-result-[0-9].json', 'gap[0-9]-result.json'):
        for f in glob.glob(str(base / 'audit' / pat)):
            ids |= {x['id'] for x in json.loads(pathlib.Path(f).read_text(encoding='utf-8'))}
    return ids


PLAZO = re.compile(r'\b(plazo|d[ií]as|meses|mes\b|a[ñn]os|h[aá]biles|naturales|vence|prescrib|caduc|computa|\d+\s*(%|por ciento|euros))', re.I)
COMPLEJO = ('III-01', 'III-02', 'III-03', 'III-04', 'III-05', 'III-06', 'IV-01', 'IV-02', 'IV-03', 'IV-04', 'IV-05', 'IV-06', 'IV-07', 'IV-08', 'IV-09',
            'V-01', 'V-02', 'V-03', 'V-04', 'V-05', 'V-06', 'II-03', 'II-04', 'I-07', 'I-05', 'I-09')

if mode == 'modificadas':
    ids = patched()
elif mode == 'tercera':  # correcciones posteriores a la tercera evaluacion (data/review3-patches.json)
    rp = json.loads((base / 'data' / 'review3-patches.json').read_text(encoding='utf-8'))
    ids = sorted(i for i in rp['edit'] if i in Q)
else:
    pool = [q for i, q in Q.items() if q['kind'] != 'practical' and i not in reviewed_blind() and i not in set(patched())]
    plazos = [q for q in pool if PLAZO.search(q['stem'] + ' ' + next(o['text'] for o in q['options'] if o['id'] == q['correctOptionId']))]
    rnd.shuffle(plazos)
    chosen = {q['id'] for q in plazos[:70]}
    rest = [q for q in pool if q['id'] not in chosen]
    rnd.shuffle(rest)
    por_tema = {}
    for q in rest:  # 1 de cada tema complejo + relleno hasta 120
        if q['topic'] in COMPLEJO and q['topic'] not in por_tema:
            por_tema[q['topic']] = q['id']
    chosen |= set(por_tema.values())
    for q in rest:
        if len(chosen) >= 120:
            break
        if q['topic'] in COMPLEJO:
            chosen.add(q['id'])
    ids = sorted(chosen)
rnd.shuffle(ids)


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


items, key, expl = [], {}, {}
for qid in ids:
    q = Q[qid]
    opts = q['options'][:]
    rnd.shuffle(opts)
    it = {'id': qid, 'tipo': q['kind'], 'tema': q['topic'], 'enunciado': q['stem'], 'opciones': {'ABCD'[k]: o['text'] for k, o in enumerate(opts)},
          'fuente': q['source']['locator'], 'texto_fuente': source_text(q)}
    if q.get('caseId'):
        it['supuesto'] = q['caseId']
    items.append(it)
    expl[qid] = {'explicacion': q.get('explanation', ''), 'cita_literal': q.get('evidenceQuote', ''), 'localizador': q['source']['locator']}
    key[qid] = {'correcta': next('ABCD'[k] for k, o in enumerate(opts) if o['id'] == q['correctOptionId'])}
size = -(-len(items) // nag)
(base / 'audit').mkdir(exist_ok=True)
for n in range(nag):
    chunk = items[n * size:(n + 1) * size]
    narr = {c: cases[c]['narrative'] for c in {i['supuesto'] for i in chunk if 'supuesto' in i}}
    (base / 'audit' / f'{prefix}-blind-{n + 1}.json').write_text(json.dumps({'narrativas': narr, 'preguntas': chunk}, ensure_ascii=False, indent=1), encoding='utf-8')
for n in range(nag):
    chunk_ids = [i['id'] for i in items[n * size:(n + 1) * size]]
    (base / 'audit' / f'{prefix}-expl-{n + 1}.json').write_text(json.dumps({i: expl[i] for i in chunk_ids}, ensure_ascii=False, indent=1), encoding='utf-8')
keypath.write_text(json.dumps(key, ensure_ascii=False, indent=1), encoding='utf-8')
(base / 'audit' / f'{prefix}-ids.json').write_text(json.dumps({'modo': mode, 'n': len(ids), 'ids': ids}, ensure_ascii=False, indent=1), encoding='utf-8')
print(mode, len(items), 'preguntas en', nag, 'ficheros; practicas:', sum(1 for i in items if i['tipo'] == 'practical'))
