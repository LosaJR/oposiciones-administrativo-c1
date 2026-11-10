"""Alarga un distractor concreto de preguntas ya redactadas (sin tocar la respuesta correcta ni su cita) y reconstruye los lotes.
Uso: python scripts/lengthen_bank.py <mapa.json>      mapa: {"Q-ID": [indice_distractor_0a2, "nuevo texto falso pero plausible"], ...}
El distractor nuevo debe seguir siendo inequívocamente falso; se revisa a mano antes de aplicarlo.
"""
import glob, io, json, pathlib, subprocess, sys

base = pathlib.Path(__file__).resolve().parents[1]
m = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding='utf-8'))
done = set()
batches = []
for f in sorted(glob.glob(str(base / 'data/drafts/*.json'))):
    p = pathlib.Path(f)
    d = json.loads(p.read_text(encoding='utf-8'))
    touched = False
    for q in d:
        qid = q['id']
        if qid in m:
            idx, text = m[qid]
            q['a'][1 + idx] = text
            done.add(qid)
            touched = True
    if touched:
        p.write_text(json.dumps(d, ensure_ascii=False, indent=0), encoding='utf-8')
        batches.append(p.stem)
print('aplicadas', len(done), 'de', len(m), '| lotes:', ' '.join(batches))
for b in batches:
    r = subprocess.run([sys.executable, '-I', str(base / 'scripts/build_batch.py'), b], capture_output=True, text=True, encoding='utf-8')
    print(b, (r.stdout.strip().splitlines() or ['?'])[-1], r.stderr.strip()[:200])
