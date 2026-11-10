"""Prepara una muestra estratificada del banco para una segunda revision a ciegas (fase de calidad).
- Estratos: bloque, tema (>= 2 preguntas de teoria u ofimatica por tema), fuente (se reparte entre normas distintas dentro del tema),
  tipo (teoria, ofimatica, practica) y complejidad aproximada (numeros/fechas/cuantias en el enunciado o la explicacion).
- Los supuestos aportan 3 preguntas por supuesto (30) y se envia tambien la narrativa.
- Cada elemento a ciegas lleva: enunciado, cuatro opciones barajadas con letras (SIN marcar la correcta), y el texto de la fuente
  (articulo completo del BOE o ventana alrededor de la cita para paginas web). La clave se guarda aparte en audit/key.json.
Uso: python -I scripts/audit-sample.py [semilla] [n_agentes]
"""
import glob, io, json, pathlib, random, re, sys

base = pathlib.Path(__file__).resolve().parents[1]
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
seed = int(sys.argv[1]) if len(sys.argv) > 1 else 20261111
nag = int(sys.argv[2]) if len(sys.argv) > 2 else 3
rnd = random.Random(seed)

bank = []
for f in sorted(glob.glob(str(base / 'data/questions/bank-*.json'))):
    for q in json.loads(pathlib.Path(f).read_text(encoding='utf-8')):
        if q['reviewStatus'] == 'audited_current':
            bank.append(q)
cases = {c['id']: c for c in json.loads((base / 'data/cases.json').read_text(encoding='utf-8'))}
total = len(bank)

def cplx(q):
    t = q['stem'] + ' ' + q.get('explanation', '')
    return 'cuantitativa' if re.search(r'\d', t) else 'conceptual'

by_topic = {}
for q in bank:
    if q['kind'] != 'practical':
        by_topic.setdefault(q['topic'], []).append(q)
sample = []
for t, qs in sorted(by_topic.items()):
    rnd.shuffle(qs)
    chosen, seen = [], set()
    # prioriza fuentes y complejidades distintas
    for q in sorted(qs, key=lambda x: (x['source']['cacheKey'] in seen, rnd.random())):
        if len(chosen) >= 2: break
        chosen.append(q); seen.add(q['source']['cacheKey'])
    sample += chosen
chosen_ids = {q['id'] for q in sample}
# resto proporcional al tamano del tema hasta el 9 % del banco no practico
rest = [q for q in bank if q['kind'] != 'practical' and q['id'] not in chosen_ids]
target = int(0.09 * len([q for q in bank if q['kind'] != 'practical']))
rnd.shuffle(rest)
sample += rest[:max(0, target - len(sample))]
for cid, c in sorted(cases.items()):
    ids = c['questionIds'][:]
    rnd.shuffle(ids)
    sample += [next(q for q in bank if q['id'] == i) for i in ids[:3]]
rnd.shuffle(sample)

def source_text(q):
    s = q['source']
    p = base / 'data' / 'source-cache' / f"{s['cacheKey']}.json"
    quote = q.get('evidenceQuote', '')
    if p.exists():
        d = json.loads(p.read_text(encoding='utf-8'))
        a = d['articles'].get(s.get('anchor') if isinstance(s.get('anchor'), str) else (s.get('anchor') or [''])[0])
        txt = a['text'] if isinstance(a, dict) else ''
        if len(txt) > 4500 and quote:
            i = max(0, txt.find(quote[:40]) - 1500)
            txt = txt[i:i + 4000]
        return txt[:4500]
    ex = json.loads((base / 'data/source-excerpts/web.json').read_text(encoding='utf-8')).get(s['cacheKey'], {})
    return ' [...] '.join(ex.get('excerpts', []))[:4000]

blind, key = [], {}
for q in sample:
    opts = q['options'][:]
    rnd.shuffle(opts)
    letters = 'ABCD'
    item = {'id': q['id'], 'tipo': q['kind'], 'tema': q['topic'], 'enunciado': q['stem'],
            'opciones': {letters[i]: o['text'] for i, o in enumerate(opts)},
            'fuente': q['source']['locator'], 'texto_fuente': source_text(q)}
    if q['kind'] == 'practical':
        c = cases[q['caseId']]
        item['supuesto'] = {'id': c['id'], 'narrativa': c['narrative']}
    blind.append(item)
    key[q['id']] = {'correcta': next(letters[i] for i, o in enumerate(opts) if o['id'] == q['correctOptionId']),
                    'explicacion': q.get('explanation', ''), 'cita': q.get('evidenceQuote', '')}
out = base / 'audit'
out.mkdir(exist_ok=True)
size = -(-len(blind) // nag)
for i in range(nag):
    (out / f'blind-{i + 1}.json').write_text(json.dumps(blind[i * size:(i + 1) * size], ensure_ascii=False, indent=1), encoding='utf-8')
(out / 'key.json').write_text(json.dumps(key, ensure_ascii=False, indent=1), encoding='utf-8')
(out / 'muestra.json').write_text(json.dumps({'semilla': seed, 'banco_auditado': total, 'muestra': len(blind), 'fraccion': round(len(blind) / total, 3),
    'por_tipo': {k: sum(1 for q in sample if q['kind'] == k) for k in ('theory', 'office', 'practical')},
    'por_bloque': {b: sum(1 for q in sample if q['topic'].split('-')[0] == b) for b in ('I', 'II', 'III', 'IV', 'V', 'VI')},
    'por_complejidad': {c: sum(1 for q in sample if cplx(q) == c) for c in ('conceptual', 'cuantitativa')},
    'fuentes_distintas': len({q['source']['cacheKey'] for q in sample}), 'temas': len({q['topic'] for q in sample}),
    'ids': [q['id'] for q in sample]}, ensure_ascii=False, indent=1), encoding='utf-8')
m = json.loads((out / 'muestra.json').read_text(encoding='utf-8'))
print({k: v for k, v in m.items() if k != 'ids'})
