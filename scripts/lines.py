"""Muestra lineas utiles de una pagina cacheada (sin ruido de navegacion). Uso: python scripts/lines.py <clave> [maximo] [recorte]"""
import io, json, pathlib, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
base = pathlib.Path(__file__).resolve().parents[1]
t = json.loads((base / 'data/source-cache' / f'{sys.argv[1]}.json').read_text(encoding='utf-8'))['articles']['page']['text']
mx = int(sys.argv[2]) if len(sys.argv) > 2 else 25
cut = int(sys.argv[3]) if len(sys.argv) > 3 else 240
n = 0
for l in t.split('\n'):
    if len(l) < 45 or 'document.' in l or 'Copilot' in l[:20] or 'Obtener ayuda' in l:
        continue
    print('-', l[:cut]); n += 1
    if n >= mx:
        break
