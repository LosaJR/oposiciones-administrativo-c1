// Filtro de la compilación de PRODUCCIÓN: el paquete que se publica solo lleva preguntas habilitadas y ningún campo interno de auditoría.
// El laboratorio conserva todo (incluidas pendientes y retiradas) para poder probarlas con el interruptor de ajustes.
// Una pregunta retirada solo viaja a producción si se publicó antes (campo `releasedIn`): así el historial de quien ya la contestó
// sigue mostrando su texto. Las que nunca estuvieron en producción no se incluyen.

export const INTERNAL_FIELDS = [
  'reviewerNotes', 'reviewedAt', 'verifiedAt', 'reviewer', 'sourceHash', 'lawVersionDate', 'evidenceQuote', 'retiredAt', 'retiredReason',
] as const;

type Q = { reviewStatus?: string };

export function filterForProduction<T extends Q>(questions: T[]): T[] {
  return questions
    .filter((q) => q.reviewStatus === 'audited_current' || (q.reviewStatus === 'retired' && !!(q as { releasedIn?: string }).releasedIn))
    .map((q) => {
      const copy = { ...q } as Record<string, unknown>;
      for (const f of INTERNAL_FIELDS) delete copy[f];
      return copy as T;
    });
}
