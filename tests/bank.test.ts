import { describe, expect, it } from 'vitest';
import { bankMap, cases, profile, questions, topics } from '../src/core/bank';
import { buildSimulacro, coverageReport, isAllowed } from '../src/core/exam';

describe('banco real (datos de data/)', () => {
  it('cada pregunta tiene 4 opciones distintas, respuesta existente y tema del programa', () => {
    const codes = new Set(topics.map((t) => t.code));
    expect(topics).toHaveLength(45);
    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.text.trim().toLowerCase())).size).toBe(4);
      expect(q.options.some((o) => o.id === q.correctOptionId)).toBe(true);
      expect(codes.has(q.topic)).toBe(true);
    }
    expect(bankMap.size).toBe(questions.length);
  });

  it('las preguntas auditadas llevan cita, fecha y revisor; las pendientes no se habilitan en producción', () => {
    for (const q of questions.filter((x) => x.reviewStatus === 'audited_current')) {
      expect(q.evidenceQuote && q.reviewedAt && q.reviewer && q.reviewerNotes && q.sourceHash).toBeTruthy();
      expect(isAllowed(q, false)).toBe(true);
    }
    for (const q of questions.filter((x) => x.reviewStatus !== 'audited_current')) expect(isAllowed(q, false)).toBe(false);
  });

  it('cada supuesto auditado tiene 20 preguntas prácticas con su caseId', () => {
    expect(cases.length).toBeGreaterThanOrEqual(2);
    for (const c of cases.filter((x) => x.reviewStatus === 'audited_current')) {
      expect(c.questionIds).toHaveLength(profile.part2.questions);
      expect(c.narrative.length).toBeGreaterThan(200);
      for (const id of c.questionIds) {
        const q = bankMap.get(id)!;
        expect(q.kind).toBe('practical');
        expect(q.caseId).toBe(c.id);
      }
    }
  });

  it('el simulacro real (solo auditadas) no repite preguntas ni hechos y se etiqueta parcial mientras falten temas', () => {
    const s = buildSimulacro(questions, cases, topics, profile, { includePending: false, seed: 42 });
    const ids = [...s.part1, ...s.cases.flatMap((c) => c.items)].map((i) => i.qid);
    expect(new Set(ids).size).toBe(ids.length);
    const facts = ids.map((id) => bankMap.get(id)!.fact ?? id);
    expect(new Set(facts).size).toBe(facts.length);
    for (const i of ids) expect(isAllowed(bankMap.get(i)!, false)).toBe(true);
    const cov = coverageReport(questions, cases, topics, false, profile);
    expect(s.partial).toBe(!cov.complete);
    expect(s.cases).toHaveLength(2);
    expect(s.part1.length).toBeLessThanOrEqual(70);
  });
});
