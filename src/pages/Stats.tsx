import { useState } from 'react';
import { useApp } from '../ctx';
import { profile, topics } from '../core/bank';
import { accuracy, aggregateByTopic, lastDays } from '../core/analytics';
import { formatDirect } from '../core/scoring';

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function Stats() {
  const { attempts, settings, coverage } = useApp();
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const agg = aggregateByTopic(attempts);
  const days = lastDays(range);
  const byDay = new Map<string, { c: number; n: number }>();
  for (const a of attempts) {
    const k = dayKey(a.finishedAt);
    const r = byDay.get(k) ?? { c: 0, n: 0 };
    r.c += a.result.part1.correct + (a.result.part2?.correct ?? 0);
    r.n += a.result.part1.total + (a.result.part2?.total ?? 0);
    byDay.set(k, r);
  }
  const pts = days.map((d, i) => { const r = byDay.get(d.key); return r && r.n ? { x: i, y: r.c / r.n } : null; });
  const W = 600, H = 150, px = (i: number) => 12 + (i * (W - 24)) / Math.max(days.length - 1, 1), py = (y: number) => H - 14 - y * (H - 28);
  const path = pts.reduce((acc, p, i) => (p ? `${acc}${acc && pts[i - 1] ? 'L' : 'M'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}` : acc), '');
  const sims = attempts.filter((a) => a.kind === 'simulacro').slice(0, 10).reverse();
  const hist = profile.historical[settings.profile];

  return (
    <div className="stack">
      <h1>Estadísticas</h1>
      {attempts.length === 0 && <p className="muted">Aún no hay datos. Termina un test para ver aquí tu evolución.</p>}

      <div className="card">
        <div className="row between">
          <h2>Evolución del acierto</h2>
          <div className="seg" role="group" aria-label="Periodo">
            {([7, 30, 90] as const).map((r) => <button key={r} aria-pressed={range === r} onClick={() => setRange(r)}>{r} días</button>)}
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Porcentaje de acierto por día" style={{ width: '100%', height: 'auto' }}>
          <line x1="12" x2={W - 12} y1={py(0)} y2={py(0)} stroke="var(--line)" />
          <line x1="12" x2={W - 12} y1={py(0.5)} y2={py(0.5)} stroke="var(--line)" strokeDasharray="4 4" />
          <text x="14" y={py(0.5) - 4} fontSize="11" fill="var(--ink-3)">50 %</text>
          <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinejoin="round" />
          {pts.map((p) => p && <circle key={p.x} cx={px(p.x)} cy={py(p.y)} r="3.5" fill="var(--brand)" />)}
        </svg>
      </div>

      {sims.length > 0 && (
        <div className="card">
          <h2>Simulacros frente al corte histórico</h2>
          <p className="small muted">Corte de referencia ({hist.label}): parte 1 = {hist.part1Display}, parte 2 = {hist.part2Display}. Histórico, no futuro.</p>
          <table className="tbl">
            <thead><tr><th>Fecha</th><th className="r">Parte 1</th><th className="r">Parte 2</th></tr></thead>
            <tbody>{sims.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.finishedAt).toLocaleDateString('es-ES')}{a.partial ? ' (parcial)' : ''}</td>
                <td className="r">{formatDirect(a.result.part1.thirds)} <span className={`chip ${a.result.part1.thirds >= hist.part1MinThirds ? 'ok' : 'bad'}`}>{a.result.part1.thirds >= hist.part1MinThirds ? 'sobre' : 'bajo'}</span></td>
                <td className="r">{a.result.part2 ? <>{formatDirect(a.result.part2.thirds)} <span className={`chip ${a.result.part2.thirds >= hist.part2MinThirds ? 'ok' : 'bad'}`}>{a.result.part2.thirds >= hist.part2MinThirds ? 'sobre' : 'bajo'}</span></> : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h2>Por tema</h2>
        <table className="tbl">
          <thead><tr><th>Tema</th><th className="r">Banco</th><th className="r">Acierto</th></tr></thead>
          <tbody>{topics.map((t) => {
            const a = accuracy(agg.get(t.code));
            return (
              <tr key={t.code}>
                <td>{t.code} · {t.title}</td>
                <td className="r">{coverage.perTopic[t.code]}</td>
                <td className="r">
                  {a === null ? <span className="muted">—</span> : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress" style={{ width: 60 }} aria-hidden="true"><i style={{ width: `${a * 100}%`, background: a < 0.5 ? 'var(--bad)' : 'var(--ok)' }} /></div>
                      <span className="num">{Math.round(a * 100)} %</span>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
}
