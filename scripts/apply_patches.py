"""Aplica correcciones puntuales de la revision (data/audit-patches.json) al banco Y a los borradores que lo generan,
para que reconstruir un lote con build_batch.py no reintroduzca el defecto.

Formato de data/audit-patches.json:
  {"remove": {"Q-ID": "motivo"},
   "edit": {"Q-ID": {"stem": "...", "explanation": "...", "options": {"texto antiguo": "texto nuevo"}, "note": "..."}}}
Es idempotente: si el texto antiguo ya no existe se ignora. Las preguntas de «remove» no se borran: pasan a `reviewStatus: retired` (se conservan para el historial del usuario) y salen de los borradores. Las ediciones suben `version` y anotan el cambio en reviewerNotes.
Uso: python -I scripts/apply_patches.py [fichero-de-correcciones]   (por defecto data/audit-patches.json; el campo opcional "label" cambia el texto que se anota)
"""
import glob, io, json, pathlib, sys, time

BASE = pathlib.Path(__file__).resolve().parents[1]
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
PATCH_FILE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else BASE / 'data' / 'audit-patches.json'
P = json.loads(PATCH_FILE.read_text(encoding='utf-8'))
LABEL = P.get('label', ' Corregida tras la segunda revision a ciegas (docs/AUDITORIA.md): ')
today = time.strftime('%Y-%m-%d')
rem, ed = P.get('remove', {}), P.get('edit', {})
changed = removed = 0
for f in glob.glob(str(BASE / 'data/questions/bank-*.json')):
    p = pathlib.Path(f)
    qs = json.loads(p.read_text(encoding='utf-8'))
    out, dirty = [], False
    for q in qs:
        if q['id'] in rem:
            if q.get('reviewStatus') != 'retired':
                q['reviewStatus'] = 'retired'
                q['retiredAt'] = today
                q['retiredReason'] = rem[q['id']]
                removed += 1; dirty = True
            out.append(q); continue
        e = ed.get(q['id'])
        if e:
            before = json.dumps(q, ensure_ascii=False, sort_keys=True)
            if 'stem' in e: q['stem'] = e['stem']
            if 'explanation' in e: q['explanation'] = e['explanation']
            if 'evidenceQuote' in e: q['evidenceQuote'] = e['evidenceQuote']
            if 'locator' in e: q['source']['locator'] = e['locator']
            for o in q['options']:
                if o['text'] in e.get('options', {}): o['text'] = e['options'][o['text']]
            if json.dumps(q, ensure_ascii=False, sort_keys=True) != before:
                q['version'] = q.get('version', 1) + 1
                q['reviewedAt'] = today
                q['reviewerNotes'] = (q.get('reviewerNotes', '') + LABEL + e.get('note', '')).strip()
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
            if 'evidenceQuote' in e and d.get('ev') != e['evidenceQuote']: d['ev'] = e['evidenceQuote']; dirty = True
            if 'locator' in e and d.get('loc') != e['locator']: d['loc'] = e['locator']; dirty = True
            for old, new in e.get('options', {}).items():
                if old in d['a']: d['a'][d['a'].index(old)] = new; dirty = True
        out.append(d)
    if dirty:
        p.write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding='utf-8')
print(f'editadas: {changed}; retiradas: {removed}')
