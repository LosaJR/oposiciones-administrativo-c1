# Preparador AGE C1

Aplicación web (PWA, sin servidor) para preparar el Cuerpo General Administrativo de la Administración del Estado (C1, acceso libre): tests por tema y simulacros con las reglas de la convocatoria 2025 (BOE-A-2025-26262).

- **Producción:** `https://losajr.github.io/oposiciones-administrativo-c1/` (pendiente de aprobación; hoy solo muestra una página provisional).
- **Laboratorio:** `https://losajr.github.io/oposiciones-administrativo-c1/laboratorio/`.

## Qué hace
- Test por tema/bloque (5, 10, 20, 50 o máximo disponible) en modo práctica o examen.
- Simulacro: 40 preguntas de los bloques I-V, 30 del VI y un supuesto de 20 a elegir entre dos, en 100 minutos. Cada error resta un tercio; en blanco no resta; las dos partes son eliminatorias.
- Preguntas, respuestas y supuestos salen en orden aleatorio en cada intento.
- Fallos, repaso espaciado, estadísticas, historial, copia de seguridad en JSON.

## Reglas de fiabilidad
- Solo se muestran en producción las preguntas `audited_current`: cada una cita el texto literal de la fuente oficial y el validador lo comprueba contra la caché.
- Las auditorías las ha hecho Claude contra el texto oficial; no hay revisión humana independiente. Contrasta siempre con el BOE.
- Las puntuaciones se comparan en tercios enteros (3·aciertos − errores). Los cortes de 2025 (31,67 y 12,67 en el turno general; 21 y 6 en el cupo 13) son históricos y no equivalen al corte de una convocatoria futura.
- El progreso se guarda en el navegador y **no se sincroniza** entre dispositivos: exporta/importa el JSON.

## Instalar en iPhone
Safari → Compartir → "Añadir a pantalla de inicio".

## Desarrollo
```bash
npm ci
npm run dev:lab     # servidor local en modo laboratorio
npm test            # pruebas unitarias
npm run lint
npm run validate    # valida el banco contra la caché de fuentes
python scripts/fetch_sources.py            # refresca la caché del BOE
python scripts/fetch_sources.py --check    # detecta normas modificadas
python scripts/art.py ley39 a68            # lee un artículo de la caché
python scripts/build_batch.py <lote>       # convierte data/drafts/<lote>.json en preguntas auditadas
```

## Ramas y publicación
- `main` = producción. `develop` = laboratorio. El workflow `.github/workflows/pages.yml` publica ambos en un único artefacto de Pages: `main` en `/` y `develop` en `/laboratorio/`.
- Un push a `develop` reconstruye `main` tal cual, así que el laboratorio no cambia la producción.
- Pasar a producción = pull request `develop → main`, solo con aprobación expresa del propietario.
- Almacenamiento y cachés están separados por entorno (`agec1-prod` / `agec1-lab`).

Más detalle en `docs/DECISIONES.md` y `docs/ESTADO.md`.
