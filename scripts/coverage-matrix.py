"""Matriz subapartado oficial del programa <-> preguntas auditadas (docs/COBERTURA.md).
Heuristica: cada tema oficial (data/syllabus.json, campo `official`) se parte en subapartados (frases) y, si hay listas
separadas por comas o puntos y comas largas, tambien en elementos. Una pregunta cubre un subapartado si comparte al menos
`MIN` palabras distintivas (sin acentos, > 4 letras, fuera de una lista de palabras vacias) con el texto de la pregunta
(enunciado, correcta, explicacion y localizador). Es una ayuda para detectar lagunas, NO una prueba de cobertura:
el resultado se revisa a mano y las decisiones quedan en data/cobertura-manual.json.
Uso: python -I scripts/coverage-matrix.py
"""
import glob, io, json, pathlib, re, sys, unicodedata

base = pathlib.Path(__file__).resolve().parents[1]
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

STOP = set('''para como entre sobre desde hasta segun donde cuando cada todos todas otros otras estos estas
aquel aquella tipos clases concepto conceptos normas norma principales principal basicas basicos generales general
funciones funcion formas forma pagos pago nociones elementos'''.split())


def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9 ]', ' ', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))


def toks(s):
    return {w for w in norm(s).split() if len(w) > 4 and w not in STOP}


def stem(w):  # raiz tosca para singular/plural y derivados cortos
    return w[:6]


manual_path = base / 'data' / 'cobertura-manual.json'
manual = json.loads(manual_path.read_text(encoding='utf-8')) if manual_path.exists() else {}

syl = json.loads((base / 'data' / 'syllabus.json').read_text(encoding='utf-8'))['topics']
qs = []
for f in glob.glob(str(base / 'data/questions/bank-*.json')):
    for q in json.loads(pathlib.Path(f).read_text(encoding='utf-8')):
        if q['reviewStatus'] != 'audited_current' or q['kind'] == 'practical':
            continue
        corr = next(o['text'] for o in q['options'] if o['id'] == q['correctOptionId'])
        txt = ' '.join([q['stem'], corr, q.get('explanation', ''), q['source']['locator']])
        qs.append((q['id'], q['topic'], {stem(w) for w in toks(txt)}))

MIN = 2
lines = ['# Cobertura del programa oficial por subapartado', '',
         'Generado con `scripts/coverage-matrix.py` (heurística de palabras comunes; ver cabecera del script). '
         'La columna «n» cuenta preguntas de teoría y ofimática auditadas del tema que comparten palabras distintivas con el subapartado; '
         '«manual» recoge la valoración posterior a mano (`data/cobertura-manual.json`). Los supuestos no se cuentan.', '']
tot = zero = weak = 0
for t in syl:
    code = t['code']
    parts = [p.strip() for p in re.split(r'(?<=[.])\s+', t['official']) if p.strip()]
    items = []
    for p in parts:
        sub = [x.strip() for x in re.split(r'[;]|,(?= [a-zA-ZÁÉÍÓÚáéíóú])', p.rstrip('.')) if len(x.strip()) > 18]
        items.append(p.rstrip('.'))
        if len(sub) > 1 and len(p) > 90:
            items.extend('  · ' + x for x in sub)
    lines += [f'## {code} · {t["title"]}', '', '| Subapartado | n | manual |', '|---|---|---|']
    for it in items:
        sub = it.strip().lstrip('· ').strip()
        wanted = {stem(w) for w in toks(sub)}
        hits = [qid for qid, tp, tk in qs if tp == code and len(wanted & tk) >= min(MIN, max(1, len(wanted)))]
        man = manual.get(code, {}).get(sub[:60], '')
        tot += 1
        if not hits:
            zero += 1
        elif len(hits) == 1:
            weak += 1
        lines.append(f'| {it.replace("|", "/")} | {len(hits)} | {man} |')
    lines.append('')
lines.append(f'Resumen heurístico: {tot} subapartados; sin ninguna pregunta: {zero}; con una sola: {weak}.')
(base / 'docs' / 'COBERTURA.md').write_text('\n'.join(lines), encoding='utf-8')
print(f'{tot} subapartados; sin ninguna: {zero}; con una: {weak}')
for t in syl:
    pass
