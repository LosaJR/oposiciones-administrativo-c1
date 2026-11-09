import { useRef, useState } from 'react';
import { useApp } from '../ctx';
import { APP_VERSION, BUILD_DATE, ENV, profile, questions } from '../core/bank';
import { requestPersistence } from '../storage/db';
import { Confirm } from '../ui/components';

const SOURCES: [string, string][] = [
  ['BOE-A-2025-26262 · Convocatoria 2025 (Anexo III, ingreso libre C1)', 'https://www.boe.es/buscar/doc.php?id=BOE-A-2025-26262'],
  ['INAP · Cuerpo General Administrativo, ingreso libre, convocatoria 2025', 'https://sede.inap.gob.es/es/procedimientos-y-servicios/seleccion/procesos-selectivos-de-cuerpos-y-escalas-generales/cuerpo-general-administrativo-de-la-administracion-del-estado-ingreso-libre-convocatoria-2025'],
  ['INAP · Nota de puntuaciones mínimas (29/09/2026)', 'https://sede.inap.gob.es/sites/sede/files/public/2026-09/PUNTUACIONES%20MINIMAS%20EJER%20UNICO%20ADVO%20L.pdf'],
  ['Constitución Española', 'https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229'],
  ['Ley 39/2015, del Procedimiento Administrativo Común', 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-10565'],
  ['Ley 40/2015, de Régimen Jurídico del Sector Público', 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-10566'],
  ['Texto refundido del Estatuto Básico del Empleado Público', 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11719'],
  ['Aviso legal del INAP (reutilización de contenidos)', 'https://www.inap.es/es/aviso-legal'],
];

export function Settings() {
  const { settings, setSettings, db, reload, persistent, pwa, includePending, discardActive } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const counts = questions.reduce<Record<string, number>>((m, q) => { m[q.reviewStatus] = (m[q.reviewStatus] ?? 0) + 1; return m; }, {});

  const exportJson = async () => {
    const data = await db!.exportAll(ENV);
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `age-c1-progreso-${ENV}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg('Copia descargada. Guárdala fuera del navegador (iCloud, correo, USB).');
  };
  const importJson = async (file: File, mode: 'merge' | 'replace') => {
    try {
      const r = await db!.importAll(JSON.parse(await file.text()), mode);
      await reload();
      setMsg(`Importado: ${r.attempts} sesiones y ${r.qstats} estadísticas (${mode === 'merge' ? 'fusionado' : 'reemplazando lo anterior'}).`);
    } catch (e) {
      setMsg(`No se pudo importar: ${(e as Error).message}`);
    }
  };
  const checkUpdate = async () => {
    const r = await pwa.checkNow();
    setMsg(r === 'new' ? 'Hay una versión nueva disponible.' : r === 'same' ? 'Tienes la última versión.' : 'No se pudo comprobar (¿sin conexión?).');
  };

  return (
    <div className="stack">
      <h1>Ajustes y fuentes</h1>
      {msg && <div className="notice" role="status">{msg}</div>}

      <div className="card">
        <h2>Preferencias</h2>
        <label className="field" htmlFor="theme">Tema</label>
        <select id="theme" value={settings.theme} onChange={(e) => void setSettings({ theme: e.target.value as 'auto' | 'light' | 'dark' })}>
          <option value="auto">Automático</option><option value="light">Claro</option><option value="dark">Oscuro</option>
        </select>
        <label className="field" htmlFor="prof" style={{ marginTop: 12 }}>Corte histórico de referencia</label>
        <select id="prof" value={settings.profile} onChange={(e) => void setSettings({ profile: e.target.value as 'general' | 'cupo13' | 'future' })}>
          {Object.entries(profile.historical).map(([k, v]) => <option key={k} value={k}>{v.label}: {v.part1Display} y {v.part2Display}</option>)}
          <option value="future">Convocatoria futura (cortes desconocidos, sin comparación)</option>
        </select>
        <label className="check"><input type="checkbox" checked={settings.avoidRecent} onChange={(e) => void setSettings({ avoidRecent: e.target.checked })} /><span>Evitar preguntas vistas en los últimos 3 días</span></label>
        <label className="check"><input type="checkbox" checked={settings.practiceFeedback} onChange={(e) => void setSettings({ practiceFeedback: e.target.checked })} /><span>En modo práctica, mostrar la solución al contestar</span></label>
        {ENV === 'lab' && (
          <label className="check"><input type="checkbox" checked={settings.includePending} onChange={(e) => void setSettings({ includePending: e.target.checked })} />
            <span><b>Laboratorio:</b> incluir preguntas pendientes de auditoría (solo para probar la aplicación). {includePending ? 'Activado.' : ''}</span></label>
        )}
      </div>

      <div className="card">
        <h2>Tu progreso está solo en este dispositivo</h2>
        <p>Esta aplicación no tiene servidor ni cuentas: el progreso vive en este navegador y <b>no se sincroniza solo</b> entre iPhone y PC. Para pasarlo, exporta una copia y impórtala en el otro dispositivo.</p>
        <div className="row">
          <button className="btn" onClick={() => void exportJson()}>Exportar copia (JSON)</button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>Importar y fusionar</button>
          <button className="btn danger" onClick={() => setConfirmDel(true)}>Borrar mis datos</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void importJson(f, 'merge'); e.target.value = ''; }} />
        <p className="small muted" style={{ marginTop: 10 }}>
          {persistent ? 'Almacenamiento local activo.' : 'Atención: el navegador no permite almacenamiento persistente; el progreso se perderá al cerrar.'}{' '}
          <button className="btn ghost small" onClick={() => void requestPersistence().then(setPersisted)}>Pedir almacenamiento protegido</button>
          {persisted !== null && (persisted ? ' Concedido.' : ' El navegador no lo concedió: instala la app en la pantalla de inicio y exporta copias con frecuencia.')}
        </p>
        <p className="small muted">En iPhone, Safari puede borrar los datos de webs que no uses en varias semanas. Instalarla en la pantalla de inicio y exportar copias lo evita.</p>
      </div>

      <div className="card">
        <h2>Instalar en el iPhone</h2>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li>Abre esta página en Safari.</li>
          <li>Toca Compartir y elige “Añadir a pantalla de inicio”.</li>
          <li>Ábrela desde el icono: funciona sin conexión y conserva el progreso.</li>
        </ol>
      </div>

      <div className="card">
        <h2>Versión y actualizaciones</h2>
        <p>Entorno: <b>{ENV === 'lab' ? 'laboratorio' : 'producción'}</b> · versión <code>{APP_VERSION}</code>{BUILD_DATE ? ` · compilada ${BUILD_DATE.slice(0, 10)}` : ''}.</p>
        <p className="small muted">La app avisa cuando hay una versión nueva y nunca recarga durante un examen en curso. Con conexión puedes forzar la comprobación.</p>
        <button className="btn ghost" onClick={() => void checkUpdate()}>Buscar actualización</button>
        {pwa.offlineReady && <p className="small muted">Lista para funcionar sin conexión.</p>}
      </div>

      <div className="card">
        <h2>Fiabilidad del banco</h2>
        <table className="tbl">
          <tbody>
            <tr><td>Auditadas contra su fuente (<code>audited_current</code>)</td><td className="r">{counts.audited_current ?? 0}</td></tr>
            <tr><td>Pendientes de auditoría</td><td className="r">{counts.source_linked_pending_individual_audit ?? 0}</td></tr>
            <tr><td>Desactualizadas / retiradas</td><td className="r">{(counts.stale ?? 0) + (counts.retired ?? 0)}</td></tr>
          </tbody>
        </table>
        <p className="small muted" style={{ marginTop: 8 }}>Cada pregunta auditada cita el texto exacto del artículo o de la página oficial de Microsoft con la fecha de comprobación. La comprobación la hace Claude contra el texto oficial; no hay una revisión humana independiente. Las leyes cambian: verifica siempre en el BOE antes de fiarte de una respuesta.</p>
        <p className="small muted">Las preguntas son originales, redactadas para esta app. No se reproducen cuestionarios del INAP ni se confunden con ellos.</p>
      </div>

      <div className="card">
        <h2>Fuentes</h2>
        <ul style={{ paddingLeft: 18, margin: 0 }}>{SOURCES.map(([t, u]) => <li key={u}><a href={u} target="_blank" rel="noreferrer">{t}</a></li>)}</ul>
        <p className="small muted" style={{ marginTop: 8 }}>Perfil de examen revisado el {profile.checked_on}: {profile.status}. Si el BOE publica una convocatoria nueva, prevalecen sus bases.</p>
      </div>

      <Confirm open={confirmDel} title="¿Borrar todos tus datos?" confirmLabel="Borrar todo" danger cancelLabel="Cancelar"
        onConfirm={() => { void discardActive().then(() => db!.clearAll()).then(reload).then(() => { setConfirmDel(false); setMsg('Datos borrados.'); }); }} onCancel={() => setConfirmDel(false)}>
        <p>Se eliminarán sesiones, fallos y estadísticas de este navegador. No se puede deshacer. Exporta una copia antes si quieres conservarlos.</p>
      </Confirm>
    </div>
  );
}
