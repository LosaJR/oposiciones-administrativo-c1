import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../ctx';
import { blocks, topics } from '../core/bank';
import type { SessionMode } from '../core/types';
import { useStart } from '../ui/useStart';

const COUNTS: (number | 'max')[] = [5, 10, 20, 50, 'max'];

export function TestSetup() {
  const { coverage, active, pool } = useApp();
  const start = useStart();
  const [sp] = useSearchParams();
  const initial = useMemo(() => {
    const t = sp.get('t');
    const b = sp.get('b');
    if (t) return new Set([t]);
    if (b) return new Set(topics.filter((x) => x.block === b).map((x) => x.code));
    return new Set<string>();
  }, [sp]);
  const [sel, setSel] = useState<Set<string>>(initial);
  const [count, setCount] = useState<number | 'max'>(10);
  const [mode, setMode] = useState<SessionMode>('practice');
  const [msg, setMsg] = useState('');

  const chosen = sel.size ? [...sel] : topics.map((t) => t.code);
  const available = chosen.reduce((n, c) => n + coverage.perTopic[c], 0);
  const toggle = (c: string) => setSel((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });

  const go = async () => {
    const label = sel.size === 0 ? 'Test de todos los temas' : sel.size === 1 ? `Test ${[...sel][0]}` : `Test de ${sel.size} temas`;
    const ok = await start.topicTest(chosen, count, mode, label);
    if (!ok) setMsg('No hay preguntas habilitadas para esa selección.');
  };

  return (
    <div className="stack">
      <h1>Test por tema</h1>
      {active && <div className="notice">Tienes una sesión sin terminar. <Link to="/sesion">Continuar</Link> o descártala desde allí para empezar otra.</div>}
      {pool.length === 0 && <div className="notice bad">No hay preguntas habilitadas todavía.</div>}

      <div className="card">
        <label className="field">Modo</label>
        <div className="seg" role="group" aria-label="Modo">
          <button aria-pressed={mode === 'practice'} onClick={() => setMode('practice')}>Práctica</button>
          <button aria-pressed={mode === 'exam'} onClick={() => setMode('exam')}>Examen</button>
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>
          {mode === 'practice' ? 'Ves la solución y la explicación al contestar cada pregunta.' : 'No ves ninguna solución hasta entregar, como en el examen.'}
        </p>
        <label className="field" style={{ marginTop: 12 }}>Número de preguntas</label>
        <div className="seg" role="group" aria-label="Número de preguntas">
          {COUNTS.map((c) => (
            <button key={c} aria-pressed={count === c} onClick={() => setCount(c)}>{c === 'max' ? 'Máximo' : c}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="row between">
          <h2>Temas</h2>
          <button className="btn ghost small" onClick={() => setSel(new Set())}>Todos</button>
        </div>
        <p className="small muted">{sel.size === 0 ? 'Sin selección = todos los temas.' : `${sel.size} seleccionados.`}</p>
        {blocks.map((b) => (
          <fieldset key={b.id} style={{ border: 0, padding: 0, margin: '0 0 8px' }}>
            <legend style={{ fontWeight: 700 }}>Bloque {b.id}. {b.title}</legend>
            {topics.filter((t) => t.block === b.id).map((t) => {
              const n = coverage.perTopic[t.code];
              return (
                <label className="check" key={t.code}>
                  <input type="checkbox" checked={sel.has(t.code)} onChange={() => toggle(t.code)} disabled={n === 0} />
                  <span>{t.code} · {t.title} <span className="muted small">({n === 0 ? 'sin preguntas' : `${n}`})</span></span>
                </label>
              );
            })}
          </fieldset>
        ))}
      </div>

      <div className="card">
        <p>Preguntas disponibles en la selección: <b className="num">{available}</b>{typeof count === 'number' && available < count ? ` (se usarán ${available})` : ''}.</p>
        <button className="btn block" disabled={!!active || available === 0} onClick={() => void go()}>Empezar test</button>
        {msg && <p role="alert" className="small" style={{ color: 'var(--bad)' }}>{msg}</p>}
      </div>
    </div>
  );
}
