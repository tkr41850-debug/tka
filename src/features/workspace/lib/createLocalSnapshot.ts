import type { LocalSnapshot } from '../types';

const WORD_PATTERN = /[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g;

function normalizeParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function normalizeSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [];

  return matches.map((sentence) => sentence.trim()).filter(Boolean);
}

function countWords(text: string): number {
  return text.match(WORD_PATTERN)?.length ?? 0;
}

function pluralize(value: number, noun: string): string {
  return `${value} ${noun}${value === 1 ? '' : 's'}`;
}

export function createLocalSnapshot(text: string): LocalSnapshot {
  const trimmed = text.trim();
  const paragraphs = trimmed ? normalizeParagraphs(trimmed) : [];
  const sentences = trimmed ? normalizeSentences(trimmed) : [];
  const words = trimmed ? countWords(trimmed) : 0;

  return {
    characters: text.length,
    words,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
    readingMinutes: words === 0 ? 0 : Math.max(1, Math.ceil(words / 200)),
  };
}

export function formatSnapshotSummary(snapshot: LocalSnapshot): string {
  if (snapshot.words === 0) {
    return 'Add text to generate a local snapshot.';
  }

  return `${pluralize(snapshot.words, 'word')} across ${pluralize(snapshot.sentences, 'sentence')} and ${pluralize(snapshot.paragraphs, 'paragraph')}.`;
}
