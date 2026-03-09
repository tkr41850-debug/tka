import { describe, expect, it } from 'vitest';
import { createLocalSnapshot, formatSnapshotSummary } from './createLocalSnapshot';

describe('createLocalSnapshot', () => {
  it('returns empty metrics for empty text', () => {
    const snapshot = createLocalSnapshot('   ');

    expect(snapshot).toEqual({
      characters: 3,
      words: 0,
      sentences: 0,
      paragraphs: 0,
      readingMinutes: 0,
    });
    expect(formatSnapshotSummary(snapshot)).toBe('Add text to generate a local snapshot.');
  });

  it('counts words, sentences, paragraphs, and reading time for multi-paragraph input', () => {
    const snapshot = createLocalSnapshot('One short sentence. Another follows.\n\nNew paragraph here.');

    expect(snapshot.words).toBe(8);
    expect(snapshot.sentences).toBe(3);
    expect(snapshot.paragraphs).toBe(2);
    expect(snapshot.readingMinutes).toBe(1);
    expect(formatSnapshotSummary(snapshot)).toBe('8 words across 3 sentences and 2 paragraphs.');
  });
});
