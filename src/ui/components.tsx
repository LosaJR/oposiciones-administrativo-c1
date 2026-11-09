import { useEffect, useRef, type ReactNode } from 'react';
import { bankMap } from '../core/bank';
import type { Answers, ExamItem } from '../core/types';

const PATHS: Record<string, ReactNode> = {
  home: <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />,
  book: <path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zm2 14h13M8 7h7" />,
  check: <path d="M4 12l5 5L20 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3" />,
  redo: <path d="M20 12a8 8 0 11-3-6.2M20 4v5h-5" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></>,
  flag: <path d="M5 21V4h12l-2 4 2 4H5" />,
};

export function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

export const LETTERS = ['A', 'B', 'C', 'D'];

/** Confirmacion modal accesible con <dialog>. */
export function Confirm({ open, title, children, confirmLabel, cancelLabel = 'Seguir', danger, onConfirm, onCancel }: {
  open: boolean; title: string; children?: ReactNode; confirmLabel: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onCancel={(e) => { e.preventDefault(); onCancel(); }} aria-labelledby="dlg-title">
      <h2 id="dlg-title">{title}</h2>
      <div className="stack">{children}</div>
      <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
        <button className="btn ghost" onClick={onCancel}>{cancelLabel}</button>
        <button className={`btn ${danger ? 'danger' : ''}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}

/** Hoja de respuestas: una celda por pregunta, con estado respondida / dudosa / actual. */
export function AnswerSheet({ items, answers, flags, cursor, onPick, reveal }: {
  items: ExamItem[]; answers: Answers; flags: Record<string, boolean>; cursor: number; onPick: (i: number) => void; reveal?: boolean;
}) {
  return (
    <div className="cells" role="list" aria-label="Hoja de respuestas">
      {items.map((it, i) => {
        const a = answers[it.qid] ?? null;
        const q = bankMap.get(it.qid);
        let cls = 'cell';
        if (reveal && q) cls += a === null ? '' : a === q.correctOptionId ? ' ok' : ' ko';
        else if (a !== null) cls += ' done';
        if (flags[it.qid]) cls += ' flag';
        if (i === cursor) cls += ' cur';
        return (
          <button key={it.qid} role="listitem" className={cls} onClick={() => onPick(i)}
            aria-label={`Pregunta ${i + 1}${a !== null ? ', respondida' : ', en blanco'}${flags[it.qid] ? ', marcada con duda' : ''}`}>
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

export function Pct({ n, d }: { n: number; d: number }) {
  if (!d) return <span className="muted">sin datos</span>;
  return <span className="num">{Math.round((100 * n) / d)} %</span>;
}

export function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m} min ${String(s % 60).padStart(2, '0')} s`;
}
