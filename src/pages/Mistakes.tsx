import { useState } from 'react';
import { useApp } from '../ctx';
import { bankMap, blocks, topicMap } from '../core/bank';
import { isAllowed } from '../core/exam';
import { useStart } from '../ui/useStart';
import { fmtDate } from '../ui/components';

export function Mistakes() {
  const { stats, active, includePending } = useApp();
  const start = useStart();
  const [block, setBlock] = useState('');
  const now = Date.now();
  const rows = [...stats.values()]
    .filter((s) => s.last !== 'c')
    .map((s) => ({ s, q: bankMap.get(s.qid) }))
    .filter((r) => r.q && (!block || topicMap.get(r.q.topic)?.block === block))
    .sort((a, b) => b.s.lastSeen - a.s.lastSeen);
  const due = [...stats.values()].filter((s) => (s.last !== 'c' || s.dueAt <= now) && bankMap.get(s.qid) && isAllowed(bankMap.get(s.qid)!, includePending)).length;

  return (
    <div className="stack">
      <h1>Mis fallos</h1>
      <div className="card">
        <p>Preguntas por repasar ahora: <b className="num">{due}</b>. Los fallos vuelven antes; los aciertos seguidos se espacian (1, 3, 7, 16 y 35 días).</p>
        <div className="row">
          {[5, 10, 20].map((n) => (
            <button key={n} className="btn small" disabled={!!active || due === 0} onClick={() => void start.review(n)}>Repasar {n}</button>
          ))}
        </div>
        {active && <p className="small muted">Termina o abandona la sesión en curso para empezar otra.</p>}
      </div>
      <div className="card">
        <div className="row between">
          <h2>Último resultado fallado o en blanco</h2>
          <select aria-label="Filtrar por bloque" value={block} onChange={(e) => setBlock(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Todos los bloques</option>
            {blocks.map((b) => <option key={b.id} value={b.id}>Bloque {b.id}</option>)}
          </select>
        </div>
        {rows.length === 0 && <p className="muted">Aún no tienes fallos guardados. Cuando falles o dejes en blanco una pregunta aparecerá aquí.</p>}
        {rows.map(({ s, q }) => (
          <div className="review" key={s.qid}>
            <div className="qno">{q!.topic} · {s.last === 'w' ? 'fallada' : 'en blanco'} el {fmtDate(s.lastSeen)} · {s.wrong} fallos de {s.seen}</div>
            <p className="stem" style={{ fontSize: '1rem' }}>{q!.stem}</p>
            <p className="small"><b>Correcta:</b> {q!.options.find((o) => o.id === q!.correctOptionId)?.text}</p>
            <p className="small muted">{q!.explanation} <a href={q!.source.url} target="_blank" rel="noreferrer">{q!.source.locator}</a></p>
          </div>
        ))}
      </div>
    </div>
  );
}
