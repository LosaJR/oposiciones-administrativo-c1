import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../ctx';
import { bankMap, topicMap, cases as allCases } from '../core/bank';
import { remainingMs } from '../core/exam';
import type { ExamItem } from '../core/types';
import { AnswerSheet, Confirm, Icon, LETTERS } from '../ui/components';

function fmtClock(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return `${h > 0 ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function Runner() {
  const { active, updateActive, finish, discardActive, settings } = useApp();
  const nav = useNavigate();
  const [part, setPart] = useState<1 | 2>(1);
  const [viewCase, setViewCase] = useState<string | null>(null);
  const [idx2, setIdx2] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [now, setNow] = useState(Date.now());
  const finishing = useRef(false);

  const s = active;
  const endNow = useCallback(async (timedOut: boolean) => {
    if (!s || finishing.current) return;
    finishing.current = true;
    const att = await finish(timedOut);
    if (att) nav(`/resultado/${att.id}${timedOut ? '?tiempo=1' : ''}`, { replace: true });
    else nav('/', { replace: true });
  }, [s, finish, nav]);

  // Reloj de pared: se recalcula siempre desde endsAt (los temporizadores se pausan en segundo plano en iOS).
  useEffect(() => {
    if (!s?.endsAt) return;
    const tick = () => {
      setNow(Date.now());
      if (s.endsAt! <= Date.now()) void endNow(true);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    const vis = () => tick();
    document.addEventListener('visibilitychange', vis);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  }, [s?.endsAt, endNow]);

  const isSim = s?.kind === 'simulacro';
  const caseItems: ExamItem[] = useMemo(() => {
    if (!s) return [];
    const id = viewCase ?? s.chosenCase ?? s.cases[0]?.caseId;
    return s.cases.find((c) => c.caseId === id)?.items ?? [];
  }, [s, viewCase]);
  const caseId = s ? (viewCase ?? s.chosenCase ?? s.cases[0]?.caseId ?? null) : null;

  const items = part === 1 ? (s?.part1 ?? []) : caseItems;
  const cursor = part === 1 ? (s?.cursor ?? 0) : idx2;
  const setCursor = useCallback((i: number) => {
    if (!s) return;
    if (part === 1) updateActive((cur) => ({ ...cur, cursor: i }));
    else setIdx2(i);
  }, [s, part, updateActive]);

  const item = items[Math.min(cursor, Math.max(items.length - 1, 0))];
  const q = item ? bankMap.get(item.qid) : undefined;
  const practice = s?.mode === 'practice';
  const answer = item && s ? (s.answers[item.qid] ?? null) : null;
  const reveal = !!(practice && settings.practiceFeedback && answer !== null);

  const lock = !!(practice && settings.practiceFeedback);
  const pick = (optId: string) => {
    if (!s || !item) return;
    const qid = item.qid;
    // Todo cambio parte del último estado guardado en memoria: dos pulsaciones seguidas no se pisan.
    updateActive((cur) => {
      const prev = cur.answers[qid] ?? null;
      if (lock && prev !== null) return cur; // en práctica con solución visible, la respuesta queda fijada
      return { ...cur, answers: { ...cur.answers, [qid]: prev === optId ? null : optId } };
    });
  };

  // Atajos de teclado: A-D / 1-4 eligen, flechas navegan.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, select, textarea, dialog')) return;
      const k = e.key.toLowerCase();
      const n = 'abcd'.indexOf(k) >= 0 ? 'abcd'.indexOf(k) : '1234'.indexOf(k);
      if (n >= 0 && item && n < item.order.length) { pick(item.order[n]); return; }
      if (k === 'arrowright' && cursor < items.length - 1) setCursor(cursor + 1);
      if (k === 'arrowleft' && cursor > 0) setCursor(cursor - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!s) return <Navigate to="/" replace />;
  const rem = remainingMs(s, now);
  const unanswered1 = s.part1.filter((i) => (s.answers[i.qid] ?? null) === null).length;
  const chosen = s.cases.find((c) => c.caseId === s.chosenCase);
  const unanswered2 = chosen ? chosen.items.filter((i) => (s.answers[i.qid] ?? null) === null).length : 0;
  const total = s.part1.length + (chosen?.items.length ?? 0);

  const toggleFlag = () => {
    if (!item) return;
    const qid = item.qid;
    updateActive((cur) => ({ ...cur, flags: { ...cur.flags, [qid]: !cur.flags[qid] } }));
  };

  return (
    <div className="stack">
      <div className="topbar">
        <div>
          <h2 style={{ marginBottom: 0, fontSize: '1.05rem' }}>{s.label}</h2>
          <span className="small muted">{s.mode === 'exam' ? 'Modo examen: sin soluciones hasta entregar' : 'Modo práctica'}</span>
        </div>
        {rem !== null && <span className={`timer ${rem < 10 * 60 * 1000 ? 'low' : ''}`} role="timer" aria-label="Tiempo restante">{fmtClock(rem)}</span>}
      </div>

      {s.partial && (
        <details className="notice">
          <summary><b>Cobertura incompleta:</b> ver carencias</summary>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{s.partialNotes.map((n) => <li key={n}>{n}</li>)}</ul>
        </details>
      )}

      {isSim && (
        <div className="seg" role="group" aria-label="Parte del examen">
          <button aria-pressed={part === 1} onClick={() => setPart(1)}>Parte 1 ({s.part1.length})</button>
          <button aria-pressed={part === 2} onClick={() => setPart(2)} disabled={s.cases.length === 0}>Parte 2 · supuesto</button>
        </div>
      )}

      {part === 2 && s.cases.map((c) => {
        const meta = c.caseId;
        const caseFile = caseMeta(meta);
        const isChosen = s.chosenCase === meta;
        return (
          <div key={meta} className={`casebox ${isChosen ? 'chosen' : ''}`}>
            <div className="row between">
              <b>{caseFile?.title ?? meta}</b>
              <div className="row">
                <button className="btn ghost small" onClick={() => { setViewCase(meta); setIdx2(0); }} aria-pressed={caseId === meta}>{caseId === meta ? 'Viendo' : 'Ver'}</button>
                <button className="btn small" onClick={() => updateActive((cur) => ({ ...cur, chosenCase: cur.chosenCase === meta ? null : meta }))} aria-pressed={isChosen}>{isChosen ? 'Elegido' : 'Elegir este'}</button>
              </div>
            </div>
            {caseId === meta && <p className="narr" style={{ marginTop: 8 }}>{caseFile?.narrative}</p>}
          </div>
        );
      })}
      {part === 2 && !s.chosenCase && <div className="notice">Elige <b>un solo supuesto</b>. Si no marcas ninguno, la segunda parte no se corrige, como en el examen oficial.</div>}
      {part === 2 && s.chosenCase && caseId !== s.chosenCase && <div className="notice">Estás viendo un supuesto que no has elegido: sus respuestas no se puntuarán.</div>}

      {!q || !item ? (
        <div className="notice">No hay preguntas en esta parte.</div>
      ) : (
        <div className="exam">
          <div>
            <article className="qcard" aria-labelledby="q-stem">
              <div className="qno">Pregunta {cursor + 1} de {items.length}{topicMap.get(q.topic) ? ` · ${q.topic}` : ''}</div>
              <p className="stem" id="q-stem">{q.stem}</p>
              <div className="opts" role="radiogroup" aria-labelledby="q-stem">
                {item.order.map((oid, n) => {
                  const o = q.options.find((x) => x.id === oid)!;
                  const checked = answer === oid;
                  let cls = 'opt';
                  if (reveal) cls += oid === q.correctOptionId ? ' correct' : checked ? ' wrong' : '';
                  return (
                    <button key={oid} role="radio" aria-checked={checked} className={cls} onClick={() => pick(oid)}>
                      <span className="bubble" aria-hidden="true">{LETTERS[n]}</span>
                      <span className="txt">{o.text}</span>
                    </button>
                  );
                })}
              </div>
              {reveal && (
                <div className="expl" role="status">
                  <b>{answer === q.correctOptionId ? 'Correcta.' : 'Incorrecta.'}</b> {q.explanation}{' '}
                  <a href={q.source.url} target="_blank" rel="noreferrer">{q.source.locator}</a>
                  {q.reviewStatus !== 'audited_current' && <div className="chip warn" style={{ marginTop: 6 }}>Pendiente de auditoría</div>}
                </div>
              )}
              <div className="qnav">
                <button className="btn ghost" disabled={cursor === 0} onClick={() => setCursor(cursor - 1)}>Anterior</button>
                <div className="mid">
                  <button className="btn ghost flagbtn" aria-pressed={!!s.flags[item.qid]} onClick={toggleFlag} aria-label="Marcar con duda"><Icon name="flag" /></button>
                  {!reveal && answer !== null && <button className="btn ghost small" onClick={() => pick(answer)}>En blanco</button>}
                </div>
                <button className="btn" disabled={cursor >= items.length - 1} onClick={() => setCursor(cursor + 1)}>Siguiente</button>
              </div>
            </article>
          </div>

          <div>
            <button className="btn ghost block sheet-toggle" onClick={() => setSheetOpen((v) => !v)} aria-expanded={sheetOpen} style={{ marginBottom: 10 }}>
              Hoja de respuestas ({items.filter((i) => (s.answers[i.qid] ?? null) !== null).length}/{items.length})
            </button>
            <div className={`sheet-wrap ${sheetOpen ? '' : 'collapsed'}`}>
              <div className="sheet">
                <AnswerSheet items={items} answers={s.answers} flags={s.flags} cursor={cursor} onPick={(i) => { setCursor(i); setSheetOpen(false); }} />
                <p className="small muted" style={{ marginTop: 10 }}>Azul: respondida · punto amarillo: dudosa · sin color: en blanco.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row between">
        <button className="btn ghost" onClick={() => setConfirmDiscard(true)}>Abandonar</button>
        <button className="btn" onClick={() => setConfirmEnd(true)}>Entregar</button>
      </div>

      <Confirm open={confirmEnd} title="¿Entregar ahora?" confirmLabel="Entregar" onConfirm={() => void endNow(false)} onCancel={() => setConfirmEnd(false)}>
        <p>Preguntas en blanco: <b>{unanswered1 + unanswered2}</b> de {total}. Las respuestas en blanco no restan.</p>
        {isSim && !s.chosenCase && s.cases.length > 0 && <p className="notice bad">No has elegido supuesto: la parte 2 no se corregirá.</p>}
        {rem !== null && <p className="small muted">Quedan {fmtClock(rem)}.</p>}
      </Confirm>
      <Confirm open={confirmDiscard} title="¿Abandonar la sesión?" confirmLabel="Abandonar" danger cancelLabel="Volver" onConfirm={() => { void discardActive().then(() => nav('/')); }} onCancel={() => setConfirmDiscard(false)}>
        <p>Se perderán las respuestas de esta sesión y no contará en tus estadísticas.</p>
      </Confirm>
      <p className="small muted"><Link to="/">Salir sin cerrar</Link>: la sesión se guarda y puedes retomarla.</p>
    </div>
  );
}

function caseMeta(id: string) { return allCases.find((c) => c.id === id); }
