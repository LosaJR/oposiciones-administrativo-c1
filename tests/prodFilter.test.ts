import { describe, expect, it } from 'vitest';
import { INTERNAL_FIELDS, filterForProduction } from '../src/core/prodFilter';
import { mkQuestion } from './helpers';

describe('compilación de producción: solo lo habilitado y nada interno', () => {
  const base = { reviewerNotes: 'x', reviewedAt: '2026', verifiedAt: '2026', reviewer: 'r', sourceHash: 'h', lawVersionDate: '20260101', evidenceQuote: 'cita', retiredAt: '2026', retiredReason: 'm' };
  const qs = [
    mkQuestion('A-1', 'I-01', { ...base }),
    mkQuestion('A-2', 'I-01', { ...base, reviewStatus: 'source_linked_pending_individual_audit' }),
    mkQuestion('A-3', 'I-01', { ...base, reviewStatus: 'retired' }),
    mkQuestion('A-4', 'I-01', { ...base, reviewStatus: 'stale' }),
    mkQuestion('A-5', 'I-01', { ...base, reviewStatus: 'retired', releasedIn: '1.0' } as never),
  ];

  it('deja pasar las auditadas y las retiradas que ya se publicaron, y descarta pendientes, desactualizadas y retiradas nunca publicadas', () => {
    expect(filterForProduction(qs).map((q) => q.id)).toEqual(['A-1', 'A-5']);
  });

  it('elimina todos los campos internos de auditoría y conserva los que usa la aplicación', () => {
    const [q] = filterForProduction(qs);
    for (const f of INTERNAL_FIELDS) expect(q, f).not.toHaveProperty(f);
    for (const f of ['id', 'stem', 'options', 'correctOptionId', 'explanation', 'source', 'fact', 'version', 'reviewStatus', 'topic', 'kind']) expect(q, f).toHaveProperty(f);
  });

  it('no modifica los objetos originales (el laboratorio conserva todo)', () => {
    filterForProduction(qs);
    expect(qs[0]).toHaveProperty('reviewerNotes');
  });
});
