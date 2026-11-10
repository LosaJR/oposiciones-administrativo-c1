"""Comprueba que una correccion del banco no rompe el historial: para las preguntas presentes en un commit anterior
(por defecto el indicado en argv[1]) y en el banco actual, los identificadores de opcion, la posicion de cada opcion y la
opcion correcta no han cambiado (el historial guarda identificadores de opcion y de pregunta, no textos).
Uso: python -I scripts/check-history-compat.py <commit>
"""
import glob, io, json, os, subprocess, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
base = sys.argv[1]
old, new = {}, {}
for f in glob.glob('data/questions/bank-*.json'):
    new.update({q['id']: q for q in json.load(open(f, encoding='utf-8'))})
    try:
        raw = subprocess.check_output(['git', 'show', f'{base}:{f}'.replace(chr(92), '/'), ]).decode('utf-8')
        old.update({q['id']: q for q in json.loads(raw)})
    except Exception:
        pass
comunes = [i for i in old if i in new]
rotos = []
for i in comunes:
    a, b = old[i], new[i]
    if [o['id'] for o in a['options']] != [o['id'] for o in b['options']] or a['correctOptionId'] != b['correctOptionId']:
        rotos.append(i)
cambiadas = [i for i in comunes if old[i]['stem'] != new[i]['stem'] or [o['text'] for o in old[i]['options']] != [o['text'] for o in new[i]['options']] or old[i]['explanation'] != new[i]['explanation']]
retiradas = [i for i in old if i not in new or new[i]['reviewStatus'] != 'audited_current' and old[i]['reviewStatus'] == 'audited_current']
print(f'preguntas comunes: {len(comunes)}; con texto cambiado: {len(cambiadas)}; con identificadores u opcion correcta alterados: {len(rotos)}; retiradas: {len(retiradas)}')
if rotos:
    print('ROTAS:', rotos); sys.exit(1)
