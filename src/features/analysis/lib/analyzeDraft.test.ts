import { describe, expect, it } from 'vitest';
import { analyzeDraft } from './analyzeDraft';

describe('analyzeDraft', () => {
  it('returns no findings for a clean draft', () => {
    const analysis = analyzeDraft('Keep instructions short. Use clear verbs.');

    expect(analysis.findings).toEqual([]);
    expect(analysis.snapshot.words).toBeGreaterThan(0);
  });

  it('detects long sentences, long paragraphs, and filler phrases with stable locations', () => {
    const draft = [
      'This sentence intentionally keeps going so it crosses the default limit with many extra words that make the sentence harder to scan during a fast technical review for readers who need a shorter path.',
      'Please note that the setup guide is ready. In order to finish the update, simply restart the service. Keep the labels short. Use direct verbs. Avoid extra steps. Confirm the result. Share the link. Archive the note.',
    ].join('\n\n');

    const analysis = analyzeDraft(draft);

    expect(analysis.findings.map((finding) => finding.ruleId)).toEqual([
      'long-sentence',
      'long-paragraph',
      'filler-phrase',
      'filler-phrase',
      'filler-phrase',
    ]);

    expect(analysis.findings[0]).toMatchObject({
      ruleLabel: 'Long sentence',
      location: {
        label: 'Sentence 1 in paragraph 1',
      },
    });

    expect(analysis.findings[1]).toMatchObject({
      ruleLabel: 'Long paragraph',
      location: {
        label: 'Paragraph 2',
      },
    });

    expect(analysis.findings[2]).toMatchObject({
      matchedText: 'Please note',
    });
  });

  it('keeps ordering stable when several findings share a severity', () => {
    const analysis = analyzeDraft('Please note that we will update the log. In order to help, simply restart it.');

    expect(analysis.findings.map((finding) => finding.matchedText)).toEqual(['Please note', 'In order to', 'simply', 'will']);
  });
});
