import { Link } from 'react-router-dom';
import { useApp } from '../ctx';
import { ENV, bankMap, questions, topics } from '../core/bank';
import { isAllowed } from '../core/exam';
import { activityByDay, aggregateByTopic, accuracy, lastDays, streak } from '../core/analytics';
import { useStart } from '../ui/useStart';

export function Home() {
  const { attempts, active, stats, pool, coverage, includePending } = useApp();
  const start = useStart();
  const agg = aggregateByTopic(attempts);
  const days = activityByDay(attempts);
  const cal = lastDays(28);
  const audited = questions.filter((q) => q.reviewStatus === 'audited_current').length;
  const covered = topics.length - coverage.missing.length;
  const due = [...stats.values()].filter((s) => (s.last !== 'c' || s.dueAt <= Date.now()) && bankMap.get(s.qid) && isAllowed(bankMap.get(s.qid)!, includePending)).length;
  const weak = topics
    .map((t) => ({ t, a: accuracy(agg.get(t.code)), n: (agg.get(t.code)?.correct ?? 0) + (agg.get(t.code)?.wrong ?? 0) + (agg.get(t.code)?.blank ?? 0) }))
    .filter((x) => x.a !== null && x.n >= 3 && coverage.perTopic[x.t.code] > 0)
    .sort((a, b) => (a.a as number) - (b.a as number))
    .slice(0, 3);
  const attemptsTotal = attempts.length;
  const answered = attempts.reduce((n, a) => n + a.result.part1.total + (a.result.part2?.total ?? 0), 0);

  return (
    <div className="stack">
      <div className="hero">
        <h1>Administrativo del Estado C1</h1>
        <p className="muted">Tests por tema y simulacros con las reglas del examen oficial.</p>
      </div>

      {active && (
        <div className="notice">
          <b>Tienes una sesión sin terminar:</b> {active.label}.{' '}
          <Link to="/sesion">Continuar</Link>
        </div>
      )}

      {pool.length === 0 && (
        <div className="notice bad">
          <b>Todavía no hay preguntas habilitadas.</b> Solo se muestran preguntas con auditoría individual contra su fuente oficial.
          {ENV === 'lab' ? ' En el laboratorio puedes activar “incluir pendientes” en Ajustes para probar la aplicación.' : ''}
        </div>
      )}

      <div className="stats3">
        <div className="stat"><b className="num">{streak(attempts)}</b><span>días seguidos</span></div>
        <div className="stat"><b className="num">{answered}</b><span>respuestas dadas</span></div>
        <div className="stat"><b className="num">{attemptsTotal}</b><span>sesiones</span></div>
      </div>

      <div className="card">
        <h2>Qué practicar hoy</h2>
        <div className="grid2">
          <button className="btn" disabled={!!active || pool.length === 0} onClick={() => void start.topicTest(topics.map((t) => t.code), 10, 'practice', 'Test rápido de 10')}>Test rápido de 10</button>
          <button className="btn ghost" disabled={!!active || due === 0} onClick={() => void start.review(10)}>Repasar fallos ({due})</button>
          <Link className="btn ghost" to="/test">Test por tema</Link>
          <Link className="btn ghost" to="/simulacro">Simulacro completo</Link>
        </div>
      </div>

      <div className="card">
        <h2>Banco de preguntas</h2>
        <p>
          <b className="num">{audited}</b> auditadas contra su fuente · <b className="num">{pool.length}</b> habilitadas ahora ·{' '}
          <b className="num">{covered}/{topics.length}</b> temas con preguntas.
        </p>
        <div className="progress ok" aria-hidden="true"><i style={{ width: `${(100 * covered) / topics.length}%` }} /></div>
        {coverage.missing.length > 0 && (
          <p className="small muted" style={{ marginTop: 8 }}>
            Sin preguntas: {coverage.missing.join(', ')}. {includePending ? '' : 'Estos temas no entran en tests ni en el simulacro.'}
          </p>
        )}
      </div>

      <div className="card">
        <h2>Últimas 4 semanas</h2>
        <div className="cal" role="img" aria-label="Actividad diaria de las últimas cuatro semanas">
          {cal.map((d) => {
            const n = days.get(d.key) ?? 0;
            return <i key={d.key} className={n === 0 ? '' : n < 15 ? 'l1' : n < 40 ? 'l2' : 'l3'} title={`${d.key}: ${n} respuestas`} />;
          })}
        </div>
      </div>

      {weak.length > 0 && (
        <div className="card">
          <h2>Temas a reforzar</h2>
          {weak.map(({ t, a }) => (
            <div key={t.code} className="row between" style={{ padding: '6px 0' }}>
              <span>{t.code} · {t.title}</span>
              <span className="chip bad num">{Math.round((a as number) * 100)} %</span>
            </div>
          ))}
          <Link className="btn ghost small" to={`/test?t=${weak[0].t.code}`}>Practicar {weak[0].t.code}</Link>
        </div>
      )}
    </div>
  );
}
