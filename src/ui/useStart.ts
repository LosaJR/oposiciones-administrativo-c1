import { useNavigate } from 'react-router-dom';
import { useApp } from '../ctx';
import { cases, profile, questions, topics } from '../core/bank';
import { buildReviewItems, buildSimulacro, buildTopicItems, buildTrainingItems, makeSession } from '../core/exam';
import { randomSeed } from '../core/rng';
import type { SessionMode } from '../core/types';

export function useStart() {
  const nav = useNavigate();
  const { saveActive, settings, stats, includePending, active } = useApp();

  const topicTest = async (sel: string[], count: number | 'max', mode: SessionMode, label: string): Promise<boolean> => {
    if (active) return false;
    const seed = randomSeed();
    const { items } = buildTopicItems(questions, { topics: sel, count, includePending, seed, avoidRecent: settings.avoidRecent, stats });
    if (!items.length) return false;
    await saveActive(makeSession('topic', mode, label, items, seed, includePending));
    nav('/sesion');
    return true;
  };

  const review = async (count: number): Promise<boolean> => {
    if (active) return false;
    const seed = randomSeed();
    const items = buildReviewItems(questions, stats, count, includePending, seed);
    if (!items.length) return false;
    await saveActive(makeSession('review', 'practice', 'Repaso de fallos', items, seed, includePending));
    nav('/sesion');
    return true;
  };

  const simulacro = async (): Promise<boolean> => {
    if (active) return false;
    const s = buildSimulacro(questions, cases, topics, profile, { includePending, seed: randomSeed(), stats: settings.avoidRecent ? stats : undefined });
    if (!s.part1.length && !s.cases.length) return false;
    await saveActive(s);
    nav('/sesion');
    return true;
  };

  const training = async (count: number): Promise<boolean> => {
    if (active) return false;
    const seed = randomSeed();
    const { items } = buildTrainingItems(questions, { count, includePending, seed, stats });
    if (!items.length) return false;
    await saveActive(makeSession('training', 'practice', 'Entrenamiento equilibrado', items, seed, includePending));
    nav('/sesion');
    return true;
  };

  return { topicTest, review, simulacro, training };
}
