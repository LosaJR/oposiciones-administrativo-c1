import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../ctx';
import { bankMap, profile, topicMap } from '../core/bank';
import { estimateScore, formatDirect, verdictExam } from '../core/scoring';
import type { Attempt, ExamItem } from '../core/types';
import { LETTERS, fmtDuration } from '../ui/components';
import { FORMAT_TEXT, presentationFor, resolveFormat } from '../core/results';

type Filter = 'all' | 'wrong' | 'blank' | 'flag';

function Ruler({ th, max, cut, label }: { th: number; max: number; cut: number | null; label: string }) {
  const pct = (v: number) => `${Math.max(0, Math.min(100, (100 * v) / max))}%`;
  return (
    <div className="ruler" role="img" aria-label={`${label}: ${formatDirect(th)} de ${max / 3}${cut !== null ? `, corte de referencia ${formatDirect(cut)}` : ''}`}>
      <div className="track" />
      <div className="fill" style={{ width: pct(Math.max(th, 0)) }} />
      {cut !== null && <div className="cut" style={{ left: pct(cut) }}><span>corte {formatDirect(cut)}</span></div>}
    </div>
  );
}

export function Result() {
  const { id } = useParams();
  const { db, settings } = useApp();
  const [sp] = useSearchParams();
  const [att, setAtt] = useState<Attempt | null | undefined>(undefined);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => { void db?.getAttempt(id!).then((a) => setAtt(a ?? null)); }, [db, id]);
  if (att === undefined) return <p className="muted">Cargando resultado…</p>;
  if (att === null) return <div className="notice bad">No se encuentra este intento. <Link to="/historial">Ver historial</Link></div>;

  const hist = settings.profile === 'future' ? null : profile.historical[settings.profile];
  const fmt = resolveFormat(att);
  const pres = presentationFor(att, settings.profile);
  const sim = att.kind === 'simulacro';
  const r1 = att.result.part1, r2 = att.result.part2;
  const v = verdictExam(r1.thirds, r2 ? r2.thirds : null, hist?.part1MinThirds ?? null, hist?.part2MinThirds ?? null);
  const max1 = profile.part1.maxDirect * 3, max2 = profile.part2.maxDirect * 3;

  const chosen = att.cases.find((c) => c.caseId === att.chosenCase);
  const reviewItems: { it: ExamItem; n: number; part: string }[] = [
    ...att.part1.map((it, i) => ({ it, n: i + 1, part: sim ? 'Parte 1' : '' })),
    ...(chosen ? chosen.items.map((it, i) => ({ it, n: i + 1, part: 'Parte 2' })) : []),
  ];
  const state = (it: ExamItem) => {
    const a = att.answers[it.qid] ?? null;
    const q = bankMap.get(it.qid);
    return a === null ? 'blank' : q && a === q.correctOptionId ? 'ok' : 'wrong';
  };
  const shown = reviewItems.filter(({ it }) => filter === 'all' || (filter === 'flag' ? att.flags[it.qid] : state(it) === filter));
  const topicRows = Object.entries(att.result.byTopic).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="stack">
      <h1>Resultado</h1>
      {sp.get('tiempo') && <div className="notice bad"><b>Se acabó el tiempo.</b> El examen se entregó automáticamente con las respuestas marcadas.</div>}
      <p className="muted">{att.label} · {new Date(att.finishedAt).toLocaleString('es-ES')} · {fmtDuration(att.finishedAt - att.startedAt)}</p>
      {sim && (
        <div className={`notice ${fmt === 'official' ? 'ok' : ''}`}>
          <b>{FORMAT_TEXT[fmt].title}.</b> {FORMAT_TEXT[fmt].body}
          {att.partialNotes.length > 0 && <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{att.partialNotes.map((n) => <li key={n}>{n}</li>)}</ul>}
        </div>
      )}
      {att.includesPending && <div className="notice bad">Esta sesión incluyó preguntas pendientes de auditoría.</div>}

      <div className="card">
        <h2>{sim ? 'Primera parte' : 'Puntuación'}</h2>
        <div className="score"><b className="num">{formatDirect(r1.thirds)}</b><span className="muted">/ {r1.total} puntos directos</span></div>
        <p className="muted small">{r1.correct} aciertos · {r1.wrong} errores (−1/3 cada uno) · {r1.blank} en blanco. En tercios: 3×{r1.correct} − {r1.wrong} = {r1.thirds}.</p>
        {sim && <Ruler th={r1.thirds} max={max1} cut={pres === 'compare' && hist ? hist.part1MinThirds : null} label="Primera parte" />}
      </div>

      {sim && (
        <div className="card">
          <h2>Segunda parte</h2>
          {r2 ? (
            <>
              <div className="score"><b className="num">{formatDirect(r2.thirds)}</b><span className="muted">/ {r2.total} puntos directos</span></div>
              <p className="muted small">{r2.correct} aciertos · {r2.wrong} errores · {r2.blank} en blanco. En tercios: {r2.thirds}.</p>
              <Ruler th={r2.thirds} max={max2} cut={pres === 'compare' && hist ? hist.part2MinThirds : null} label="Segunda parte" />
            </>
          ) : <p>No has elegido supuesto (o no hay supuestos): esta parte no se corrige.</p>}
        </div>
      )}

      {pres === 'compare' && hist && (
        <div className="card">
          <h2>Comparación con el corte histórico</h2>
          <p className="small muted">Referencia: {hist.label}. Cortes publicados por el INAP el {hist.published}: {hist.part1Display} y {hist.part2Display}. <b>Son históricos: no son el corte de ninguna convocatoria futura.</b> <a href={hist.source} target="_blank" rel="noreferrer">Nota oficial</a></p>
          <div className="row">
            <span className={`chip ${v.part1 === 'pass' ? 'ok' : v.part1 === 'fail' ? 'bad' : ''}`}>Parte 1: {v.part1 === 'pass' ? 'por encima del corte' : v.part1 === 'fail' ? 'por debajo del corte' : '—'}</span>
            <span className={`chip ${v.part2 === 'pass' ? 'ok' : v.part2 === 'fail' ? 'bad' : ''}`}>Parte 2: {v.part2 === 'pass' ? 'por encima del corte' : v.part2 === 'fail' ? 'por debajo del corte' : v.part2 === 'not_evaluated' ? 'no se evaluaría' : 'sin corregir'}</span>
          </div>
          <p style={{ marginTop: 10 }}>
            {v.global === 'pass' && 'Superarías ambos cortes históricos. Las dos partes son eliminatorias.'}
            {v.global === 'fail' && (v.part1 === 'fail' ? 'Con este resultado quedarías eliminado en la primera parte: la segunda ni se evaluaría.' : 'Quedarías eliminado en la segunda parte.')}
            {v.global === 'unknown' && 'Falta información para comparar ambas partes.'}
          </p>
          <p className="small muted">Estimación lineal de entrenamiento (0 a 50, no oficial): parte 1 ≈ {estimateScore(r1.thirds, hist.part1MinThirds, max1)}{r2 ? `, parte 2 ≈ ${estimateScore(r2.thirds, hist.part2MinThirds, max2)}` : ''}.</p>
        </div>
      )}

      {pres === 'future' && (
        <div className="card">
          <h2>Convocatoria futura: cortes desconocidos</h2>
          <p>El tribunal fija la puntuación directa mínima de cada parte en cada convocatoria y aún no existe la próxima. Por eso no se declara aprobado ni suspenso: tu resultado son {formatDirect(r1.thirds)} puntos directos en la parte 1{r2 ? ` y ${formatDirect(r2.thirds)} en la parte 2` : ''}. Cambia el corte de referencia en Ajustes si quieres compararlo con uno histórico.</p>
        </div>
      )}

      {pres === 'coverage-reference' && hist && (
        <div className="card">
          <h2>Referencia histórica orientativa</h2>
          <p className="small muted">Los cortes de {hist.label} fueron {hist.part1Display} (parte 1) y {hist.part2Display} (parte 2). Como este simulacro no cubre todo el temario, <b>no se indica si los superarías</b> ni se estima una nota oficial.</p>
        </div>
      )}

      {pres === 'partial' && (
        <div className="card">
          <h2>Sin comparación con el examen oficial</h2>
          <p className="small muted">Un simulacro parcial no es comparable con los cortes del tribunal. Usa los resultados por tema para decidir qué repasar.</p>
        </div>
      )}

      {topicRows.length > 0 && (
        <div className="card">
          <h2>Por tema</h2>
          <table className="tbl">
            <thead><tr><th>Tema</th><th className="r">Acierto</th><th className="r">Fallo</th><th className="r">Blanco</th></tr></thead>
            <tbody>{topicRows.map(([t, r]) => (
              <tr key={t}><td>{t} · {topicMap.get(t)?.title ?? ''}</td><td className="r">{r.correct}</td><td className="r">{r.wrong}</td><td className="r">{r.blank}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <div className="card">
        <div className="row between">
          <h2>Revisión</h2>
          <div className="seg" role="group" aria-label="Filtro">
            {([['all', 'Todas'], ['wrong', 'Fallos'], ['blank', 'Blanco'], ['flag', 'Dudas']] as [Filter, string][]).map(([f, l]) => (
              <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>{l}</button>
            ))}
          </div>
        </div>
        {shown.length === 0 && <p className="muted">Nada que mostrar con este filtro.</p>}
        {shown.map(({ it, n, part }) => {
          const q = bankMap.get(it.qid);
          if (!q) return <div className="review" key={it.qid}><p className="muted">Pregunta {n}: ya no está en el banco.</p></div>;
          const a = att.answers[it.qid] ?? null;
          const retired = q.reviewStatus === 'retired' || q.reviewStatus === 'stale';
          return (
            <div className="review" key={it.qid}>
              <div className="qno">{part ? `${part} · ` : ''}Pregunta {n} · {q.topic} {att.flags[it.qid] ? '· marcada con duda' : ''}</div>
              {retired && <div className="notice bad">Esta pregunta se {q.reviewStatus === 'retired' ? 'retiró' : 'marcó como desactualizada'} después de tu intento. Se conserva en tu historial.</div>}
              <p className="stem">{q.stem}</p>
              <div className="opts static">
                {it.order.map((oid, i) => {
                  const o = q.options.find((x) => x.id === oid)!;
                  const cls = oid === q.correctOptionId ? 'opt correct' : a === oid ? 'opt wrong' : 'opt';
                  return (
                    <div key={oid} className={cls}>
                      <span className="bubble" aria-hidden="true">{LETTERS[i]}</span>
                      <span className="txt">{o.text}{a === oid ? ' (tu respuesta)' : ''}{oid === q.correctOptionId ? ' (correcta)' : ''}</span>
                    </div>
                  );
                })}
              </div>
              {a === null && <p className="small muted">Dejaste esta pregunta en blanco.</p>}
              <div className="expl">{q.explanation} <a href={q.source.url} target="_blank" rel="noreferrer">{q.source.locator}</a>
                {q.reviewStatus === 'source_linked_pending_individual_audit' && <div className="chip warn" style={{ marginTop: 6 }}>Pendiente de auditoría</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="row"><Link className="btn" to="/test">Otro test</Link><Link className="btn ghost" to="/fallos">Repasar fallos</Link></div>
    </div>
  );
}
