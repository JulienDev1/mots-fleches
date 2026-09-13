import { generateGrilleGeante } from '../src/data/mockGeante';

export type Difficulty = 'facile' | 'moyen' | 'difficile';

export const getDailyGrid = (difficulty?: Difficulty) => {
  return generateGrilleGeante();
};

export const canPlayGrid = (): boolean => true;
export const registerGridPlayed = (): void => {};

// Récupère la date du jour au format YYYY-MM-DD
export const getTodayKey = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};