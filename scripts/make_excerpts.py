"""Genera data/source-excerpts/web.json: para cada pagina web citada (Microsoft Support) guarda solo
la URL, la fecha de consulta, el hash del texto completo y las frases citadas por las preguntas.
El texto completo de esas paginas NO se publica (derechos de terceros): data/source-cache/ms-*.json esta en .gitignore.
El validador usa este archivo cuando no existe la copia completa (por ejemplo, en CI).
"""
import io, json, pathlib, sys

BASE = pathlib.Path(__file__).resolve().parents[1]
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
out = {}
for f in sorted((BASE / 'data/questions').glob('*.json')):
    for q in json.loads(f.read_text(encoding='utf-8')):
        if q.get('reviewStatus') != 'audited_current':
            continue
        key = q['source'].get('cacheKey', '')
        if not key.startswith('ms-'):
            continue
        cache = json.loads((BASE / 'data/source-cache' / f'{key}.json').read_text(encoding='utf-8'))
        e = out.setdefault(key, {'url': cache['url'], 'title': cache['title'], 'fetchedAt': cache['fetchedAt'], 'pageHash': q['sourceHash'], 'excerpts': []})
        if e['pageHash'] != q['sourceHash']:
            raise SystemExit(f'{key}: hashes distintos entre preguntas')
        if q['evidenceQuote'] not in e['excerpts']:
            e['excerpts'].append(q['evidenceQuote'])
dest = BASE / 'data/source-excerpts'
dest.mkdir(exist_ok=True)
(dest / 'web.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'{len(out)} paginas, {sum(len(v["excerpts"]) for v in out.values())} fragmentos')
