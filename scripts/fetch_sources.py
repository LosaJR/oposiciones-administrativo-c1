"""Descarga el texto consolidado de cada norma desde la API de datos abiertos del BOE
y lo guarda por articulo en data/source-cache/<clave>.json.

Uso:  python scripts/fetch_sources.py [clave ...]     (sin argumentos: todas)
      python scripts/fetch_sources.py --check         (compara fecha_actualizacion con la guardada; no escribe)
      python scripts/fetch_sources.py --refresh-changed  (solo normas BOE cuya fecha cambio; no toca las paginas web;
                                                        luego hay que ejecutar `npm run validate`)

Cada articulo conserva solo la version vigente (la ultima). El BOE publica la fecha de
actualizacion de cada norma: si cambia, las preguntas que la citan pasan a revision.
"""
import html, json, pathlib, re, sys, time, urllib.request
import xml.etree.ElementTree as ET

BASE = pathlib.Path(__file__).resolve().parents[1]
CACHE = BASE / 'data' / 'source-cache'
API = 'https://www.boe.es/datosabiertos/api/legislacion-consolidada/id/{id}/{what}'


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={'Accept': 'application/xml', 'User-Agent': 'agec1-source-cache/1.0'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2)
    raise RuntimeError('unreachable')


NL = chr(10)


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', s.replace(' ', ' ')).strip()


def fetch(key: str, boe_id: str) -> dict:
    meta = ET.fromstring(get(API.format(id=boe_id, what='metadatos')))
    m = meta.find('./data/metadatos')
    title = norm(m.findtext('titulo', ''))
    updated = m.findtext('fecha_actualizacion', '')
    derog = m.findtext('estatus_derogacion', '')
    root = ET.fromstring(get(API.format(id=boe_id, what='texto')))
    arts = {}
    for b in root.iter('bloque'):
        versions = b.findall('version')
        if not versions:
            continue
        v = versions[-1]
        text = '\n'.join(norm(''.join(p.itertext())) for p in v.findall('p'))
        arts[b.get('id')] = {'title': b.get('titulo', ''), 'text': text, 'vigencia': v.get('fecha_vigencia', '')}
    return {
        'key': key, 'id': boe_id, 'title': title, 'derogada': derog, 'boeUpdated': updated,
        'fetchedAt': time.strftime('%Y-%m-%d'), 'url': f'https://www.boe.es/buscar/act.php?id={boe_id}', 'articles': arts,
    }


def fetch_web(key: str, url: str) -> dict:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 agec1-source-cache/1.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read().decode('utf-8', errors='replace')
        final = r.geturl()
    m = re.search(r'<main[\s\S]*?</main>', raw)
    body = m.group(0) if m else raw
    body = re.sub(r'<(script|style|nav|header|footer|noscript)[\s\S]*?</>', '', body)
    body = re.sub(r'</(p|div|li|h\d|tr|section|article|ul|ol|table)>|<br\s*/?>', NL, body)
    text = html.unescape(re.sub(r'<[^>]+>', '', body))
    lines = [norm(l) for l in text.split(NL)]
    text = NL.join(l for l in lines if l)
    tm = re.search(r'<title>(.*?)</title>', raw)
    title = norm(html.unescape(tm.group(1))) if tm else key
    return {'key': key, 'id': final, 'title': title, 'derogada': '', 'boeUpdated': '', 'fetchedAt': time.strftime('%Y-%m-%d'),
            'url': final, 'articles': {'page': {'title': title, 'text': text, 'vigencia': ''}}}


def main(argv: list[str]) -> int:
    reg = json.loads((BASE / 'data' / 'sources.json').read_text(encoding='utf-8'))
    check = '--check' in argv
    refresh = '--refresh-changed' in argv
    keys = [a for a in argv if not a.startswith('--')] or list(reg)
    CACHE.mkdir(parents=True, exist_ok=True)
    changed = 0
    for k in keys:
        entry = reg[k]
        if entry.get('kind') not in ('boe', 'web'):
            continue
        if entry['kind'] == 'web' and (check or refresh):
            continue
        path = CACHE / f'{k}.json'
        if refresh:
            meta = ET.fromstring(get(API.format(id=entry['id'], what='metadatos')))
            upd = meta.find('./data/metadatos').findtext('fecha_actualizacion', '')
            old = json.loads(path.read_text(encoding='utf-8'))['boeUpdated'] if path.exists() else None
            if upd == old:
                continue
            data = fetch(k, entry['id'])
            path.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
            changed += 1
            print(f'{k:14} {entry["id"]:18} ACTUALIZADA ({old} -> {upd})')
            continue
        if check:
            meta = ET.fromstring(get(API.format(id=entry['id'], what='metadatos')))
            upd = meta.find('./data/metadatos').findtext('fecha_actualizacion', '')
            old = json.loads(path.read_text(encoding='utf-8'))['boeUpdated'] if path.exists() else None
            flag = 'SIN CAMBIOS' if upd == old else f'CAMBIADA ({old} -> {upd})'
            changed += upd != old
            print(f'{k:14} {entry.get("id", "web"):18} {flag}')
            continue
        try:
            data = fetch(k, entry['id']) if entry['kind'] == 'boe' else fetch_web(k, entry['url'])
        except Exception as e:  # noqa: BLE001
            print(f'{k:14} {entry.get("id", "web"):18} ERROR {e}')
            continue
        path.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
        print(f'{k:14} {entry.get("id", "web"):18} {len(data["articles"]):4} bloques | {data["title"][:90]}')
    if refresh:
        print(f'{changed} normas actualizadas')
    return 1 if (check and changed) else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
