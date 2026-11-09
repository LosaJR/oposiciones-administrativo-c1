import { describe, expect, it } from 'vitest';
import { presentationFor, resolveFormat } from '../src/core/results';

const att = (kind: 'topic' | 'simulacro', format?: 'official' | 'coverage-insufficient' | 'partial' | 'topic', partial = false) => ({ kind, format, partial });

describe('presentación del resultado según el formato', () => {
  it('solo el simulacro completo con cobertura oficial se compara con un corte histórico', () => {
    expect(presentationFor(att('simulacro', 'official'), 'general')).toBe('compare');
    expect(presentationFor(att('simulacro', 'official'), 'cupo13')).toBe('compare');
  });

  it('con cobertura temática insuficiente solo hay referencia orientativa, nunca veredicto', () => {
    expect(presentationFor(att('simulacro', 'coverage-insufficient'), 'general')).toBe('coverage-reference');
  });

  it('un simulacro parcial es solo descriptivo', () => {
    expect(presentationFor(att('simulacro', 'partial', true), 'general')).toBe('partial');
    expect(presentationFor(att('simulacro', 'partial', true), 'future')).toBe('partial');
  });

  it('una convocatoria futura sin cortes no emite veredicto aunque el simulacro sea completo', () => {
    expect(presentationFor(att('simulacro', 'official'), 'future')).toBe('future');
  });

  it('un test por tema nunca se compara con el examen', () => {
    expect(presentationFor(att('topic', 'topic'), 'general')).toBe('topic');
  });

  it('intentos guardados antes de existir el campo format se interpretan con prudencia', () => {
    expect(resolveFormat(att('simulacro', undefined, true))).toBe('partial');
    expect(resolveFormat(att('simulacro', undefined, false))).toBe('official');
  });
});
