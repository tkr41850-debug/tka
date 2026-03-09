export type AnalysisState = 'fresh' | 'stale';

export type LocalSnapshot = {
  characters: number;
  words: number;
  sentences: number;
  paragraphs: number;
  readingMinutes: number;
};
