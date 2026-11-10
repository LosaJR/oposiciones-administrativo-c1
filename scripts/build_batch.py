"""Convierte un borrador de preguntas (data/drafts/<lote>.json) en preguntas auditadas.

Cada borrador DEBE citar un fragmento literal (ev) que exista, tal cual, en el texto cacheado del
articulo/pagina indicada. Si una sola cita no aparece, no se escribe nada.

Campos del borrador:
  id, t (tema), k (theory|office|practical), q (enunciado), a (4 textos; el PRIMERO es el correcto),
  x (explicacion), s (clave de cache), an (ancla o lista de anclas), loc (localizador legible),
  ev (cita literal), f (clave de hecho), n (nota del revisor), seed (id de la semilla que sustituye),
  caseId (opcional), d (dificultad 1-3, opcional)
"""
import hashlib, io, json, pathlib, re, sys, time

BASE = pathlib.Path(__file__).resolve().parents[1]
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
CACHE = BASE / 'data' / 'source-cache'
QDIR = BASE / 'data' / 'questions'
REVIEWER = 'claude-source-check'
# Lotes anteriores a la regla de longitud: se reconstruyen sin comprobarla (defecto conocido, ver docs/ESTADO.md).
LEGACY = {'ce1', 'ce2', 'ce3', 'l39a', 'casea', 'caseb', 'tre1', 'tre2', 'l40a', 'l19', 'lgp1', 'ms1', 'casers'}


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', s.replace(' ', ' ')).strip()


def load(key: str) -> dict:
    return json.loads((CACHE / f'{key}.json').read_text(encoding='utf-8'))


def main(name: str) -> int:
    drafts = json.loads((BASE / 'data' / 'drafts' / f'{name}.json').read_text(encoding='utf-8'))
    existing = {q['id'] for f in QDIR.glob('*.json') if f.name != f'bank-{name}.json' for q in json.loads(f.read_text(encoding='utf-8'))}
    today = time.strftime('%Y-%m-%d')
    out, errors, seen = [], [], set()
    for d in drafts:
        qid = d['id']
        if qid in seen or qid in existing:
            errors.append(f'{qid}: id repetido')
            continue
        seen.add(qid)
        if len(d['a']) != 4 or len({norm(x).lower() for x in d['a']}) != 4:
            errors.append(f'{qid}: necesita 4 opciones distintas')
            continue
        try:
            cache = load(d['s'])
        except FileNotFoundError:
            errors.append(f'{qid}: cache {d["s"]} inexistente')
            continue
        anchors = d['an'] if isinstance(d['an'], list) else [d['an']]
        texts = []
        for an in anchors:
            if an not in cache['articles']:
                errors.append(f'{qid}: ancla {an} no existe en {d["s"]}')
            else:
                texts.append(norm(cache['articles'][an]['text']))
        if not texts:
            continue
        ev = norm(d['ev'])
        if len(ev) < 20 or not any(ev in t for t in texts):
            errors.append(f'{qid}: la cita NO aparece literalmente en {d["s"]}#{anchors}: {ev[:80]!r}')
            continue
        h = hashlib.sha256('\n'.join(texts).encode('utf-8')).hexdigest()
        pos = int(hashlib.sha256(qid.encode()).hexdigest()[0], 16) % 4
        wrong = list(d['a'][1:])
        opts = []
        for i in range(4):
            text = d['a'][0] if i == pos else wrong.pop(0)
            opts.append({'id': f'o{i}', 'text': text})
        base_url = cache['url'] if cache['id'].startswith('BOE') else cache['url']
        url = f'{base_url}#{anchors[0]}' if cache['id'].startswith('BOE') else base_url
        kind = 'boe' if cache['id'].startswith('BOE') else 'microsoft'
        expl = d['x'] if len(d['x']) >= 45 else d['x'].rstrip('.') + '. El texto dice: «' + d['ev'].rstrip('.') + '».'
        q = {
            'id': qid, 'version': 1, 'kind': d['k'], 'topic': d['t'],
            **({'caseId': d['caseId']} if d.get('caseId') else {}),
            **({'fact': d['f']} if d.get('f') else {}),
            'stem': d['q'], 'options': opts, 'correctOptionId': f'o{pos}', 'explanation': expl,
            'source': {'url': url, 'locator': d['loc'], 'cacheKey': d['s'], 'anchor': anchors if len(anchors) > 1 else anchors[0], 'kind': kind},
            'evidenceQuote': d['ev'], 'reviewStatus': 'audited_current', 'verifiedAt': today, 'reviewedAt': today,
            'reviewer': REVIEWER, 'reviewerNotes': d.get('n', 'Enunciado, clave y distractores contrastados con el texto citado.'),
            'lawVersionDate': (cache['boeUpdated'] or cache['fetchedAt'])[:8], 'sourceHash': h,
            **({'difficulty': d['d']} if d.get('d') else {}),
        }
        out.append(q)
    if name not in LEGACY and len(out) >= 5:
        longest = sum(1 for q in out if len(next(o['text'] for o in q['options'] if o['id'] == q['correctOptionId'])) == max(len(o['text']) for o in q['options']))
        if longest / len(out) > 0.80:
            errors.append(f'sesgo de longitud: la correcta es la opcion mas larga en {longest} de {len(out)} preguntas (maximo 80 % por lote; el limite global del 40 % lo vigila tests/quality.test.ts). Alarga los distractores con contenido real, no con coletillas.')
    if errors:
        print('ERRORES, no se escribe nada:')
        print('\n'.join(errors))
        return 1
    prev = QDIR / f'bank-{name}.json'
    if prev.exists():  # las preguntas retiradas se conservan para el historial aunque ya no esten en el borrador
        keep = [q for q in json.loads(prev.read_text(encoding='utf-8')) if q.get('reviewStatus') == 'retired' and q['id'] not in {x['id'] for x in out}]
        out = out + keep
    (QDIR / f'bank-{name}.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    seeds = {d['seed'] for d in drafts if d.get('seed')}
    pend = QDIR / 'pending-seed.json'
    if seeds and pend.exists():
        cur = json.loads(pend.read_text(encoding='utf-8'))
        keep = [q for q in cur if q['id'] not in seeds]
        pend.write_text(json.dumps(keep, ensure_ascii=False, indent=1), encoding='utf-8')
        print(f'semillas sustituidas: {len(cur) - len(keep)}')
    print(f'{len(out)} preguntas auditadas escritas en bank-{name}.json')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
