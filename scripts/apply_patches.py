"""Aplica correcciones puntuales de la revision (data/audit-patches.json) al banco Y a los borradores que lo generan,
para que reconstruir un lote con build_batch.py no reintroduzca el defecto.

Formato de data/audit-patches.json:
  {"remove": {"Q-ID": "motivo"},
   "edit": {"Q-ID": {"stem": "...", "explanation": "...", "options": {"texto antiguo": "texto nuevo"}, "note": "..."}}}
Es idempotente: si el texto antiguo ya no existe se ignora. Las ediciones suben `version` y anotan el cambio en reviewerNotes.
Uso: python -I scripts/apply_patches.py
"""
import glob, io, json, pathlib, sys, time

BASE = pathlib.Path(__file__).resolve().parents[1]
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
P = json.loads((BASE / 'data' / 'audit-patches.json').read_text(encoding='utf-8'))
today = time.strftime('%Y-%m-%d')
rem, ed = P.get('remove', {}), P.get('edit', {})
changed = removed = 0
for f in glob.glob(str(BASE / 'data/questions/bank-*.json')):
    p = pathlib.Path(f)
    qs = json.loads(p.read_text(encoding='utf-8'))
    out, dirty = [], False
    for q in qs:
        if q['id'] in rem:
            removed += 1; dirty = True; continue
        e = ed.get(q['id'])
        if e:
            before = json.dumps(q, ensure_ascii=False, sort_keys=True)
            if 'stem' in e: q['stem'] = e['stem']
            if 'explanation' in e: q['explanation'] = e['explanation']
            for o in q['options']:
                if o['text'] in e.get('options', {}): o['text'] = e['options'][o['text']]
            if json.dumps(q, ensure_ascii=False, sort_keys=True) != before:
                q['version'] = q.get('version', 1) + 1
                q['reviewedAt'] = today
                q['reviewerNotes'] = (q.get('reviewerNotes', '') + ' Corregida tras la segunda revision a ciegas (docs/AUDITORIA.md): ' + e.get('note', '')).strip()
                changed += 1; dirty = True
        out.append(q)
    if dirty:
        p.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
for f in glob.glob(str(BASE / 'data/drafts/*.json')):
    p = pathlib.Path(f)
    if p.name.endswith('.meta.json'):
        continue
    ds = json.loads(p.read_text(encoding='utf-8'))
    if not isinstance(ds, list):
        continue
    out, dirty = [], False
    for d in ds:
        if not isinstance(d, dict) or 'id' not in d:
            out.append(d); continue
        if d['id'] in rem:
            dirty = True; continue
        e = ed.get(d['id'])
        if e:
            if 'stem' in e and d.get('q') != e['stem']: d['q'] = e['stem']; dirty = True
            if 'explanation' in e and d.get('x') != e['explanation']: d['x'] = e['explanation']; dirty = True
            for old, new in e.get('options', {}).items():
                if old in d['a']: d['a'][d['a'].index(old)] = new; dirty = True
        out.append(d)
    if dirty:
        p.write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding='utf-8')
print(f'editadas: {changed}; retiradas: {removed}')
