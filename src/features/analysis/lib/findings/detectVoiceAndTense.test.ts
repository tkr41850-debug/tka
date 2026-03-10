import { describe, expect, it } from 'vitest';
import { detectVoiceAndTense } from './detectVoiceAndTense';
import { parseDraft } from '../parseDraft';

describe('detectVoiceAndTense', () => {
  it('flags likely passive voice conservatively', () => {
    const findings = detectVoiceAndTense(parseDraft('The release was completed by the documentation team.'));

    expect(findings).toHaveLength(2);
    expect(findings[0]).toMatchObject({
      ruleId: 'passive-voice',
      matchedText: 'was completed',
    });
  });

  it('avoids a common adjectival false positive', () => {
    const findings = detectVoiceAndTense(parseDraft('The release is ready for review.'));

    expect(findings).toEqual([]);
  });

  it('flags tense drift for clear future or past markers', () => {
    const findings = detectVoiceAndTense(parseDraft('The guide explains the workflow. The team will update the screenshots tomorrow.'));

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      ruleId: 'tense-drift',
      matchedText: 'will',
      location: {
        label: 'Sentence 2 in paragraph 1',
      },
    });
  });
});
