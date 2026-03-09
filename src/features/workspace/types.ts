export type AnalysisState = 'stale' | 'queued' | 'running' | 'fresh' | 'error';

export type LocalSnapshot = {
  characters: number;
  words: number;
  sentences: number;
  paragraphs: number;
  readingMinutes: number;
};
