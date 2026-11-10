"""Sustituye el texto de la opcion correcta (primera) de preguntas de un borrador. Uso: python scripts/shorten.py <lote> <mapa.json>
mapa.json: {"Q-ID": "nuevo texto correcto", ...}. La explicacion y la cita no cambian."""
import io, json, pathlib, sys
base = pathlib.Path(__file__).resolve().parents[1]
p = base / 'data/drafts' / f'{sys.argv[1]}.json'
m = json.loads(pathlib.Path(sys.argv[2]).read_text(encoding='utf-8'))
d = json.loads(p.read_text(encoding='utf-8'))
n = 0
for q in d:
    if q['id'] in m:
        q['a'][0] = m[q['id']]
        n += 1
p.write_text(json.dumps(d, ensure_ascii=False, indent=0), encoding='utf-8')
print('cambiadas', n, 'de', len(m))
