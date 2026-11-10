"""Une los resultados de los revisores a ciegas con la clave y escribe audit/resultados.json (registro permanente).
Uso: python -I scripts/audit-merge.py <clave-muestra.json> <clave-supuestos.json> [prefijo-salida]
Lee audit/result-N.json (muestra estratificada) y audit/result-cases-N.json (supuestos completos).
"""
import glob, io, json, pathlib, sys

base = pathlib.Path(__file__).resolve().parents[1]
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
KEYS = {'muestra': json.loads(pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')),
        'supuestos': json.loads(pathlib.Path(sys.argv[2]).read_text(encoding='utf-8'))}
rows = []
for kind, pat in (('muestra', 'result-[0-9].json'), ('supuestos', 'result-cases-[0-9].json')):
    for f in sorted(glob.glob(str(base / 'audit' / pat))):
        for x in json.loads(pathlib.Path(f).read_text(encoding='utf-8')):
            k = KEYS[kind][x['id']]['correcta']
            rows.append({'id': x['id'], 'conjunto': kind, 'elegida': x['elegida'], 'clave': k, 'coincide': x['elegida'] == k,
                         'veredicto': x['veredicto'], 'confianza': x['confianza'], 'problemas': x.get('problemas', ''),
                         'opciones_problematicas': x.get('opciones_problematicas', [])})
summ = {}
for kind in ('muestra', 'supuestos'):
    r = [x for x in rows if x['conjunto'] == kind]
    summ[kind] = {'revisadas': len(r), 'coinciden_con_la_clave': sum(x['coincide'] for x in r),
                  'ok': sum(x['veredicto'] == 'ok' for x in r), 'dudosas': sum(x['veredicto'] == 'dudosa' for x in r),
                  'errores': sum(x['veredicto'] == 'error' for x in r), 'con_observaciones': sum(bool(x['problemas']) for x in r)}
(base / 'audit' / 'resultados.json').write_text(json.dumps({'resumen': summ, 'detalle': rows}, ensure_ascii=False, indent=1), encoding='utf-8')
print(json.dumps(summ, ensure_ascii=False))
