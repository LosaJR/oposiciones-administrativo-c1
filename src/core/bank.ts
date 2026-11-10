import type { CaseFile, ExamProfile, Question, Topic } from './types';
import syllabus from '../../data/syllabus.json';
import profileJson from '../../data/exam-profile.json';
import casesJson from '../../data/cases.json';

const files = import.meta.glob('../../data/questions/*.json', { eager: true, import: 'default' }) as Record<string, Question[]>;

export const questions: Question[] = Object.values(files).flat();
export const cases: CaseFile[] = casesJson as CaseFile[];
export const topics: Topic[] = (syllabus as { topics: Topic[] }).topics;
export const blocks = (syllabus as { blocks: { id: string; title: string; kind: string }[] }).blocks;
export const profile = profileJson as unknown as ExamProfile;
export const bankMap: Map<string, Question> = new Map(questions.map((q) => [q.id, q]));
export const topicMap: Map<string, Topic> = new Map(topics.map((t) => [t.code, t]));

export const ENV: 'lab' | 'prod' = import.meta.env.VITE_ENV === 'lab' ? 'lab' : 'prod';
export const APP_VERSION: string = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'dev';
export const BUILD_DATE: string = (import.meta.env.VITE_BUILD_DATE as string | undefined) ?? '';
