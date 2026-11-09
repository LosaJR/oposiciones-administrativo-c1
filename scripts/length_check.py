"""Lista las preguntas de un borrador cuya opcion correcta es la mas larga. Uso: python scripts/length_check.py <lote>"""
import io, json, pathlib, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
d = json.loads((pathlib.Path(__file__).resolve().parents[1] / 'data/drafts' / f'{sys.argv[1]}.json').read_text(encoding='utf-8'))
for q in d:
    c = len(q['a'][0]); o = [len(x) for x in q['a'][1:]]
    if c >= max(o):
        print(q['id'], f'correcta {c} vs max distractor {max(o)} (media {sum(o)//3})')
