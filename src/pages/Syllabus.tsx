import { Link } from 'react-router-dom';
import { useApp } from '../ctx';
import { blocks, topics } from '../core/bank';
import { accuracy, aggregateByTopic } from '../core/analytics';

export function Syllabus() {
  const { attempts, coverage } = useApp();
  const agg = aggregateByTopic(attempts);
  return (
    <div className="stack">
      <h1>Temario</h1>
      <p className="muted">45 temas del Anexo III de la convocatoria 2025 (BOE-A-2025-26262). El examen oficial no fija cuántas preguntas salen de cada tema.</p>
      {blocks.map((b) => {
        const ts = topics.filter((t) => t.block === b.id);
        const n = ts.reduce((a, t) => a + coverage.perTopic[t.code], 0);
        return (
          <section className="card" key={b.id} aria-labelledby={`b-${b.id}`}>
            <div className="row between">
              <h2 id={`b-${b.id}`}>Bloque {b.id}. {b.title}</h2>
              <Link className="btn ghost small" to={`/test?b=${b.id}`}>Test del bloque</Link>
            </div>
            <p className="small muted">{ts.length} temas · {n} preguntas habilitadas</p>
            {ts.map((t) => {
              const cnt = coverage.perTopic[t.code];
              const acc = accuracy(agg.get(t.code));
              return (
                <div className="topic" key={t.code}>
                  <div>
                    <div><span className="code">{t.code}</span> <span className="t">{t.title}</span></div>
                    <div className="small">
                      {cnt === 0 ? <span className="empty-topic">Sin preguntas habilitadas</span> : <span className="muted">{cnt} preguntas</span>}
                      {acc !== null && <span className="muted"> · acierto {Math.round(acc * 100)} %</span>}
                    </div>
                    <details><summary>Epígrafe oficial</summary><p>{t.official}</p></details>
                  </div>
                  <Link className="btn ghost small" to={`/test?t=${t.code}`} aria-disabled={cnt === 0}>Test</Link>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
