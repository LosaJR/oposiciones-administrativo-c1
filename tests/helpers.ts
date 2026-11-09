import type { CaseFile, ExamProfile, Question, Topic } from '../src/core/types';
import syllabus from '../data/syllabus.json';
import profileJson from '../data/exam-profile.json';

export const topics = (syllabus as { topics: Topic[] }).topics;
export const profile = profileJson as unknown as ExamProfile;

export function mkQuestion(id: string, topic: string, over: Partial<Question> = {}): Question {
  const kind = topic.startsWith('VI') ? 'office' : 'theory';
  return {
    id, version: 1, kind, topic, fact: `fact-${id}`, stem: `Pregunta ${id}`,
    options: [0, 1, 2, 3].map((i) => ({ id: `o${i}`, text: `Opción ${i} de ${id}` })),
    correctOptionId: 'o0', explanation: 'x', source: { url: 'https://www.boe.es/x', locator: 'art. 1' },
    reviewStatus: 'audited_current', ...over,
  };
}

/** Banco sintetico completo: 45 temas x n preguntas + 2 supuestos de 20. */
export function fullBank(perTopic = 12): { questions: Question[]; cases: CaseFile[] } {
  const questions: Question[] = [];
  for (const t of topics) for (let i = 0; i < perTopic; i++) questions.push(mkQuestion(`${t.code}-${i}`, t.code));
  const cases: CaseFile[] = ['A', 'B'].map((c) => {
    const ids: string[] = [];
    for (let i = 0; i < 20; i++) {
      const id = `CASE-${c}-${i}`;
      ids.push(id);
      questions.push(mkQuestion(id, 'III-03', { kind: 'practical', caseId: `CASE-${c}` }));
    }
    return { id: `CASE-${c}`, title: c, narrative: 'n', topics: ['III-03'], questionIds: ids, sources: [], reviewStatus: 'audited_current' };
  });
  return { questions, cases };
}
