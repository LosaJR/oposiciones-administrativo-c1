import type { Attempt, Settings, SimulacroFormat } from './types';

/** Cómo debe presentarse un resultado. Solo 'compare' puede decir «por encima/por debajo» de un corte. */
export type ResultPresentation =
  | 'topic' // test por tema o repaso: sin comparación con el examen
  | 'compare' // simulacro completo con formato y cobertura oficiales y corte histórico elegido
  | 'future' // simulacro completo, pero el corte de una convocatoria futura es desconocido
  | 'coverage-reference' // formato oficial con temas sin cubrir: solo referencia histórica orientativa
  | 'partial'; // faltan preguntas o supuestos: solo resultados descriptivos

export function resolveFormat(a: Pick<Attempt, 'kind' | 'format' | 'partial'>): SimulacroFormat {
  if (a.kind !== 'simulacro') return 'topic';
  if (a.format) return a.format;
  return a.partial ? 'partial' : 'official'; // intentos guardados antes de existir `format`
}

export function presentationFor(a: Pick<Attempt, 'kind' | 'format' | 'partial'>, profile: Settings['profile']): ResultPresentation {
  const f = resolveFormat(a);
  if (f === 'topic') return 'topic';
  if (f === 'partial') return 'partial';
  if (f === 'coverage-insufficient') return 'coverage-reference';
  return profile === 'future' ? 'future' : 'compare';
}

export const FORMAT_TEXT: Record<SimulacroFormat, { title: string; body: string }> = {
  topic: { title: 'Test por tema', body: '' },
  official: {
    title: 'Simulacro completo con formato oficial',
    body: 'Tiene 40 preguntas de los bloques I-V, 30 del bloque VI y dos supuestos de 20, y los 45 temas tienen preguntas.',
  },
  'coverage-insufficient': {
    title: 'Simulacro con formato oficial y cobertura temática insuficiente',
    body: 'Tiene la estructura del examen, pero hay temas del programa sin preguntas habilitadas. Los resultados describen tu nivel en lo que hay, no equivalen a superar el examen.',
  },
  partial: {
    title: 'Simulacro parcial',
    body: 'Faltan preguntas o supuestos respecto al examen oficial. Los resultados son descriptivos y no se comparan con ningún corte.',
  },
};
