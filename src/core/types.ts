export type Block = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
export type Kind = 'theory' | 'office' | 'practical';
export type ReviewStatus =
  | 'source_linked_pending_individual_audit'
  | 'audited_current'
  | 'stale'
  | 'retired';

export interface Option { id: string; text: string }

export interface QuestionSource {
  url: string;
  locator: string;
  /** clave del texto cacheado en data/source-cache (p.ej. ce, ley39-2015) */
  cacheKey?: string;
  /** articulo/seccion dentro de la cache (p.ej. a68) */
  anchor?: string | string[];
  kind?: 'boe' | 'eur-lex' | 'microsoft' | 'inap' | 'other';
}

export interface Question {
  id: string;
  version: number;
  kind: Kind;
  topic: string;
  caseId?: string;
  /** clave de hecho: dos preguntas con la misma clave no coinciden en un simulacro */
  fact?: string;
  stem: string;
  options: Option[];
  correctOptionId: string;
  explanation: string;
  source: QuestionSource;
  evidenceQuote?: string;
  reviewStatus: ReviewStatus;
  verifiedAt?: string;
  reviewedAt?: string;
  reviewer?: string;
  reviewerNotes?: string;
  lawVersionDate?: string;
  sourceHash?: string;
  difficulty?: 1 | 2 | 3;
}

export interface CaseFile {
  id: string;
  title: string;
  narrative: string;
  topics: string[];
  questionIds: string[];
  sources: string[];
  reviewStatus: ReviewStatus;
}

export interface Topic {
  code: string; block: Block; number: number; title: string; official: string; part: 'theory' | 'office';
}

export interface Cutoff {
  label: string; source: string; published: string;
  part1MinThirds: number; part2MinThirds: number; part1Display: string; part2Display: string;
}

export interface ExamProfile {
  id: string; title: string; durationMinutes: number; checked_on: string; status: string;
  part1: { theory: number; office: number; reservePerPart: number; theoryBlocks: string[]; officeBlocks: string[]; maxDirect: number };
  part2: { questions: number; casesOffered: number; reserve: number; maxDirect: number };
  historical: Record<string, Cutoff>;
  futureCall: { published: boolean; part1MinThirds: number | null; part2MinThirds: number | null };
}

export interface ExamItem { qid: string; order: string[] }
export type Answers = Record<string, string | null>;

export type SessionKind = 'topic' | 'simulacro' | 'review';
export type SessionMode = 'exam' | 'practice';

export interface Session {
  id: string;
  kind: SessionKind;
  mode: SessionMode;
  label: string;
  seed: number;
  startedAt: number;
  /** instante de cierre (reloj de pared); solo simulacros */
  endsAt?: number;
  partial: boolean;
  partialNotes: string[];
  includesPending: boolean;
  part1: ExamItem[];
  cases: { caseId: string; items: ExamItem[] }[];
  chosenCase: string | null;
  reserve: { part1: ExamItem[]; cases: Record<string, ExamItem[]> };
  answers: Answers;
  flags: Record<string, boolean>;
  cursor: number;
}

export interface PartResult { correct: number; wrong: number; blank: number; total: number; thirds: number }

export interface Attempt {
  id: string;
  kind: SessionKind;
  mode: SessionMode;
  label: string;
  seed: number;
  startedAt: number;
  finishedAt: number;
  timedOut: boolean;
  partial: boolean;
  partialNotes: string[];
  includesPending: boolean;
  part1: ExamItem[];
  cases: { caseId: string; items: ExamItem[] }[];
  chosenCase: string | null;
  answers: Answers;
  flags: Record<string, boolean>;
  qversions: Record<string, number>;
  result: {
    part1: PartResult;
    part2: PartResult | null;
    byTopic: Record<string, { correct: number; wrong: number; blank: number }>;
  };
}

export interface QStat {
  qid: string; seen: number; correct: number; wrong: number; blank: number;
  lastSeen: number; box: number; dueAt: number; last: 'c' | 'w' | 'b';
}

export interface Settings {
  includePending: boolean;
  theme: 'auto' | 'light' | 'dark';
  avoidRecent: boolean;
  profile: 'general' | 'cupo13';
  practiceFeedback: boolean;
}
