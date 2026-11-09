"""Visor de la cache de fuentes.
   python scripts/art.py ley39 a68 a69        imprime esos articulos
   python scripts/art.py ley39 --grep silencio  busca bloques que contengan el texto
   python scripts/art.py ley39 --list          lista los bloques (id y titulo)
"""
import io, json, pathlib, re, sys

BASE = pathlib.Path(__file__).resolve().parents[1]
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

key, rest = sys.argv[1], sys.argv[2:]
data = json.loads((BASE / 'data' / 'source-cache' / f'{key}.json').read_text(encoding='utf-8'))
arts = data['articles']
if rest[:1] == ['--list']:
    for k, v in arts.items():
        print(k, '|', v['title'])
elif rest[:1] == ['--grep']:
    pat = re.compile(rest[1], re.I)
    for k, v in arts.items():
        m = pat.search(v['text'])
        if m:
            i = max(0, m.start() - 80)
            print(f"{k} | {v['title']} | ...{v['text'][i:m.end() + 120]!r}")
else:
    maxc = 2500
    for a in rest:
        v = arts.get(a)
        if not v:
            print(f'## {a}: NO EXISTE')
            continue
        t = v['text']
        print(f"## {a} | {v['title']} | vigencia {v['vigencia']}\n{t[:maxc]}{' [...]' if len(t) > maxc else ''}\n")
