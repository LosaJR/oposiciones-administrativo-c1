import { Link } from 'react-router-dom';
import { useApp } from '../ctx';
import { formatDirect } from '../core/scoring';
import { fmtDate, fmtDuration } from '../ui/components';

export function History() {
  const { attempts } = useApp();
  return (
    <div className="stack">
      <h1>Historial</h1>
      {attempts.length === 0 && <p className="muted">Todavía no has terminado ninguna sesión.</p>}
      {attempts.map((a) => (
        <Link key={a.id} to={`/resultado/${a.id}`} className="card row between" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div>
            <b>{a.label}</b>
            <div className="small muted">{fmtDate(a.finishedAt)} · {fmtDuration(a.finishedAt - a.startedAt)}{a.timedOut ? ' · tiempo agotado' : ''}{a.includesPending ? ' · incluía pendientes' : ''}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <b className="num">{formatDirect(a.result.part1.thirds)}</b><span className="muted small"> / {a.result.part1.total}</span>
            {a.result.part2 && <div className="small num">P2: {formatDirect(a.result.part2.thirds)} / {a.result.part2.total}</div>}
          </div>
        </Link>
      ))}
    </div>
  );
}
