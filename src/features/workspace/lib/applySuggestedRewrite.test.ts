import { describe, expect, it } from 'vitest';
import type { DraftFinding } from '../../analysis/types';
import { applySuggestedRewrite, undoSuggestedRewrite } from './applySuggestedRewrite';

const finding: DraftFinding = {
  id: 'complex-wording:7:14',
  ruleId: 'complex-wording',
  ruleLabel: 'Complex wording',
  severity: 'low',
  confidence: 'deterministic',
  explanation: 'Use plainer wording.',
  matchedText: 'utilize',
  location: {
    start: 7,
    end: 14,
    excerpt: 'Please utilize clear verbs.',
    label: 'Sentence 1 in paragraph 1',
    sentenceNumber: 1,
    paragraphNumber: 1,
  },
  rulePriority: 35,
  suggestions: [
    {
      id: 'utilize-plain-language',
      label: 'Use "use" instead',
      description: 'Direct replacement.',
      kind: 'replace',
      exampleText: 'use',
      replacementText: 'use',
      isAutoApplicable: true,
    },
  ],
};

describe('applySuggestedRewrite', () => {
  it('applies an exact-range replacement and records one-step undo metadata', () => {
    const result = applySuggestedRewrite({
      draft: 'Please utilize clear verbs.',
      finding,
      suggestion: finding.suggestions[0],
      selection: { start: 0, end: 6 },
    });

    expect(result).toEqual({
      ok: true,
      draft: 'Please use clear verbs.',
      selection: { start: 7, end: 10 },
      undoSnapshot: {
        draft: 'Please utilize clear verbs.',
        selection: { start: 0, end: 6 },
        findingId: finding.id,
      },
    });
  });

  it('rejects apply when the source range no longer matches the finding text', () => {
    const result = applySuggestedRewrite({
      draft: 'Please update clear verbs.',
      finding,
      suggestion: finding.suggestions[0],
    });

    expect(result).toEqual({
      ok: false,
      reason: 'stale-offset',
    });
  });

  it('restores the prior draft and selection through one-step undo', () => {
    const applied = applySuggestedRewrite({
      draft: 'Please utilize clear verbs.',
      finding,
      suggestion: finding.suggestions[0],
      selection: { start: 18, end: 23 },
    });

    expect(applied.ok).toBe(true);

    if (!applied.ok) {
      throw new Error('Expected rewrite to apply.');
    }

    expect(undoSuggestedRewrite(applied.undoSnapshot)).toEqual({
      draft: 'Please utilize clear verbs.',
      selection: { start: 18, end: 23 },
    });
  });
});
