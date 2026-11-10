"""Une los resultados de la tercera evaluacion a ciegas (preguntas modificadas y muestra nueva) con sus claves y los
anade a audit/resultados.json (clave 'revision_3'). Uso: python -I scripts/audit-merge2.py <clave-mod.json> <clave-m2.json> [<clave-r3.json>]
Lee audit/{mod,m2}-result-N.json (etapa 1, a ciegas) y audit/{mod,m2}-expl-result-N.json (etapa 2, explicaciones).
"""
import glob, io, json, pathlib, sys

base = pathlib.Path(__file__).resolve().parents[1]
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
keys = {'modificadas': json.loads(pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')), 'muestra_nueva': json.loads(pathlib.Path(sys.argv[2]).read_text(encoding='utf-8'))}
pref = {'modificadas': 'mod', 'muestra_nueva': 'm2'}
if len(sys.argv) > 3:
    keys['correcciones_finales'] = json.loads(pathlib.Path(sys.argv[3]).read_text(encoding='utf-8'))
    pref['correcciones_finales'] = 'r3'
rows, resumen, hallazgos = [], {}, []
for kind, p in pref.items():
    r1 = [x for f in sorted(glob.glob(str(base / 'audit' / f'{p}-result-[0-9].json'))) for x in json.loads(pathlib.Path(f).read_text(encoding='utf-8'))]
    r2 = {x['id']: x for f in sorted(glob.glob(str(base / 'audit' / f'{p}-expl-result-[0-9].json'))) for x in json.loads(pathlib.Path(f).read_text(encoding='utf-8'))}
    for x in r1:
        k = keys[kind][x['id']]['correcta']
        e = r2.get(x['id'], {})
        row = {'id': x['id'], 'conjunto': kind, 'elegida': x['elegida'], 'clave': k, 'coincide': x['elegida'] == k, 'veredicto': x['veredicto'],
               'opciones_parciales_o_dudosas': [o for o, v in (x.get('opciones_falsas') or {}).items() if v != 'clara'], 'pistas': x.get('pistas', ''),
               'vigencia_dudosa': x.get('vigencia_dudosa', False), 'problemas': x.get('problemas', ''), 'explicacion': e.get('explicacion', 'sin evaluar'), 'comentario_explicacion': e.get('comentario', '')}
        rows.append(row)
        if row['veredicto'] != 'ok' or row['opciones_parciales_o_dudosas'] or row['vigencia_dudosa'] or row['explicacion'] in ('deficiente', 'incorrecta') or not row['coincide']:
            hallazgos.append(row)
    rr = [x for x in rows if x['conjunto'] == kind]
    resumen[kind] = {'revisadas': len(rr), 'coinciden_con_la_clave': sum(x['coincide'] for x in rr), 'ok': sum(x['veredicto'] == 'ok' for x in rr),
                     'dudosas': sum(x['veredicto'] == 'dudosa' for x in rr), 'errores': sum(x['veredicto'] == 'error' for x in rr),
                     'con_opcion_parcial_o_dudosa': sum(bool(x['opciones_parciales_o_dudosas']) for x in rr),
                     'explicaciones_deficientes': sum(x['explicacion'] == 'deficiente' for x in rr), 'explicaciones_incorrectas': sum(x['explicacion'] == 'incorrecta' for x in rr),
                     'explicaciones_sin_evaluar': sum(x['explicacion'] == 'sin evaluar' for x in rr), 'vigencia_dudosa': sum(bool(x['vigencia_dudosa']) for x in rr)}
path = base / 'audit' / 'resultados.json'
data = json.loads(path.read_text(encoding='utf-8'))
data['revision_3'] = {'resumen': resumen, 'detalle': rows}
path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
print(json.dumps(resumen, ensure_ascii=False, indent=1))
print('HALLAZGOS:', len(hallazgos))
for h in hallazgos:
    print('-', h['id'], h['veredicto'], 'coincide' if h['coincide'] else 'NO COINCIDE', h['opciones_parciales_o_dudosas'], h['explicacion'], '|', (h['problemas'] or h['pistas'] or h['comentario_explicacion'])[:230])
