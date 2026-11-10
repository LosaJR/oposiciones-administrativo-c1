"""Restaura como `retired` (para que el historial las conserve) las preguntas que se borraron del banco tras haber estado en un
commit de referencia. Uso: python -I scripts/restore_retired.py <commit-base> <fichero-de-correcciones> [...]
"""
import glob, io, json, pathlib, subprocess, sys, time

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
base = sys.argv[1]
rem = {}
for f in sys.argv[2:]:
    rem.update(json.loads(pathlib.Path(f).read_text(encoding='utf-8')).get('remove', {}))
now = {q['id'] for f in glob.glob('data/questions/bank-*.json') for q in json.load(open(f, encoding='utf-8'))}
n = 0
for f in sorted(glob.glob('data/questions/bank-*.json')):
    try:
        raw = subprocess.check_output(['git', 'show', f'{base}:{f}'.replace(chr(92), '/')], stderr=subprocess.DEVNULL).decode('utf-8')
    except Exception:
        continue
    lost = [q for q in json.loads(raw) if q['id'] in rem and q['id'] not in now]
    if not lost:
        continue
    cur = json.load(open(f, encoding='utf-8'))
    for q in lost:
        q['reviewStatus'] = 'retired'; q['retiredAt'] = time.strftime('%Y-%m-%d'); q['retiredReason'] = rem[q['id']]
        cur.append(q); n += 1; print('restaurada como retirada:', q['id'])
    pathlib.Path(f).write_text(json.dumps(cur, ensure_ascii=False, indent=1), encoding='utf-8')
print(n, 'preguntas restauradas como retiradas')
