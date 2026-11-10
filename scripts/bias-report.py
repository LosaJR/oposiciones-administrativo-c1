"""Sesgo de longitud por lote: compara el banco actual con el de un commit anterior (por defecto HEAD).
Dos medidas: «estricta» (la correcta es la opcion mas larga, aunque sea por un caracter) y «clara» (la correcta mide al menos
un 25 % mas que el distractor mas largo; es la que de verdad delata la respuesta). Escribe audit/sesgo-longitud.json.
Uso: python -I scripts/bias-report.py [commit-base]
"""
import glob, io, json, os, subprocess, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
base = sys.argv[1] if len(sys.argv) > 1 else 'HEAD'


def stats(qs):
    st = cl = 0
    for q in qs:
        c = len(next(o['text'] for o in q['options'] if o['id'] == q['correctOptionId']))
        d = max(len(o['text']) for o in q['options'] if o['id'] != q['correctOptionId'])
        st += c > d
        cl += c >= 1.25 * d
    return st, cl


rows = {}
for f in sorted(glob.glob('data/questions/bank-*.json')):
    b = os.path.basename(f)[5:-5]
    now = [q for q in json.load(open(f, encoding='utf-8')) if q['reviewStatus'] == 'audited_current']
    try:
        raw = subprocess.check_output(['git', 'show', base + ':' + f.replace(chr(92), '/')]).decode('utf-8')
        old = [q for q in json.loads(raw) if q['reviewStatus'] == 'audited_current']
    except Exception:
        old = now
    rows[b] = (len(now),) + stats(old) + stats(now)
T = [sum(r[i] for r in rows.values()) for i in range(5)]
print('GLOBAL n', T[0], '| estricta antes/despues', round(100 * T[1] / T[0], 1), round(100 * T[3] / T[0], 1),
      '| clara (>=25 %) antes/despues', round(100 * T[2] / T[0], 1), round(100 * T[4] / T[0], 1))
for b, r in sorted(rows.items(), key=lambda x: -x[1][4] / x[1][0]):
    if r[0] >= 8 and (r[4] / r[0] > 0.25 or r[2] != r[4]):
        print(f'{b:8} n={r[0]:3}  estricta {100 * r[1] // r[0]:3}% -> {100 * r[3] // r[0]:3}%   clara {100 * r[2] // r[0]:3}% -> {100 * r[4] // r[0]:3}%')
json.dump({'base': base, 'lotes': {b: {'n': r[0], 'estricta_antes': r[1], 'clara_antes': r[2], 'estricta_despues': r[3], 'clara_despues': r[4]} for b, r in rows.items()}},
          open('audit/sesgo-longitud.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


# --- por tema y por supuesto (comparando el banco actual con el commit base) ---
def carga(ref):
    out = []
    for f in sorted(glob.glob('data/questions/bank-*.json')):
        try:
            raw = open(f, encoding='utf-8').read() if ref is None else subprocess.check_output(['git', 'show', ref + ':' + f.replace(chr(92), '/')], stderr=subprocess.DEVNULL).decode('utf-8')
        except Exception:
            continue
        out += [q for q in json.loads(raw) if q['reviewStatus'] == 'audited_current']
    return out


def agrupa(qs, key):
    g = {}
    for q in qs:
        k = key(q)
        if k:
            g.setdefault(k, []).append(q)
    return g


antes, ahora = carga(base), carga(None)
res = {}
for nombre, key in (('tema', lambda q: q['topic'] if q['kind'] != 'practical' else None), ('supuesto', lambda q: q.get('caseId'))):
    ga, gn = agrupa(antes, key), agrupa(ahora, key)
    res[nombre] = {k: {'n': len(gn[k]), 'estricta_antes': round(100 * stats(ga.get(k, []))[0] / max(1, len(ga.get(k, []))), 1), 'estricta_despues': round(100 * stats(gn[k])[0] / len(gn[k]), 1),
                       'clara_antes': round(100 * stats(ga.get(k, []))[1] / max(1, len(ga.get(k, []))), 1), 'clara_despues': round(100 * stats(gn[k])[1] / len(gn[k]), 1)} for k in sorted(gn)}
d = json.load(open('audit/sesgo-longitud.json', encoding='utf-8'))
d.update({'por_tema': res['tema'], 'por_supuesto': res['supuesto']})
json.dump(d, open('audit/sesgo-longitud.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('--- supuestos (estricta antes->despues | clara antes->despues)')
for k, v in res['supuesto'].items():
    print(f"{k:7} n={v['n']:3}  {v['estricta_antes']:5.1f}->{v['estricta_despues']:5.1f} | {v['clara_antes']:5.1f}->{v['clara_despues']:5.1f}")
peor = sorted(res['tema'].items(), key=lambda x: -x[1]['clara_despues'])[:6]
print('--- temas con mas sesgo claro tras la correccion:', ', '.join(f"{k} {v['clara_despues']}%" for k, v in peor))
mejor = sorted(res['tema'].items(), key=lambda x: x[1]['estricta_despues'] - x[1]['estricta_antes'])[:5]
print('--- temas con mayor mejora estricta:', ', '.join(f"{k} {v['estricta_antes']}->{v['estricta_despues']}" for k, v in mejor))
