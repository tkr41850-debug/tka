import type { DraftFinding } from '../../types';
import type { ParsedDraft } from '../parseDraft';

const PASSIVE_VERB_PATTERN = /\b(am|is|are|was|were|be|been|being)\s+([a-z]+(?:ed|en|wn|lt|pt|rt|rn))\b/i;
const PASSIVE_FALSE_POSITIVES = new Set(['ready', 'tired', 'able', 'aware']);
const TENSE_DRIFT_PATTERN = /\b(was|were|had|did|will)\b/i;

function createSentenceLabel(sentenceNumber: number, paragraphNumber: number) {
  return `Sentence ${sentenceNumber} in paragraph ${paragraphNumber}`;
}

export function detectVoiceAndTense(parsedDraft: ParsedDraft): DraftFinding[] {
  const findings: DraftFinding[] = [];

  for (const sentence of parsedDraft.sentences) {
    const passiveMatch = sentence.text.match(PASSIVE_VERB_PATTERN);

    if (passiveMatch) {
      const matchedParticiple = passiveMatch[2]?.toLowerCase() ?? '';

      if (!PASSIVE_FALSE_POSITIVES.has(matchedParticiple)) {
        const matchedText = passiveMatch[0];
        const passiveStart = sentence.start + (passiveMatch.index ?? 0);
        const passiveEnd = passiveStart + matchedText.length;
        const hasByPhrase = /\bby\b/i.test(sentence.text.slice((passiveMatch.index ?? 0) + matchedText.length));

        findings.push({
          id: '',
          ruleId: 'passive-voice',
          ruleLabel: 'Likely passive voice',
          severity: 'low',
          confidence: 'heuristic',
          explanation: hasByPhrase
            ? 'This sentence likely uses passive voice because a be-verb plus participle is followed by a by-phrase.'
            : 'This sentence likely uses passive voice because it pairs a be-verb with a likely participle.',
          matchedText,
          location: {
            start: passiveStart,
            end: passiveEnd,
            excerpt: sentence.text,
            label: createSentenceLabel(sentence.sentenceNumber, sentence.paragraphNumber),
            sentenceNumber: sentence.sentenceNumber,
            paragraphNumber: sentence.paragraphNumber,
          },
          rulePriority: 40,
          suggestions: [],
        });
      }
    }

    const tenseMatch = sentence.text.match(TENSE_DRIFT_PATTERN);

    if (tenseMatch) {
      const matchedText = tenseMatch[0];
      const tenseStart = sentence.start + (tenseMatch.index ?? 0);
      const tenseEnd = tenseStart + matchedText.length;

      findings.push({
        id: '',
        ruleId: 'tense-drift',
        ruleLabel: 'Likely tense drift',
        severity: 'low',
        confidence: 'heuristic',
        explanation: `"${matchedText}" suggests this sentence may drift away from the default present-tense guidance for technical writing.`,
        matchedText,
        location: {
          start: tenseStart,
          end: tenseEnd,
          excerpt: sentence.text,
          label: createSentenceLabel(sentence.sentenceNumber, sentence.paragraphNumber),
          sentenceNumber: sentence.sentenceNumber,
          paragraphNumber: sentence.paragraphNumber,
        },
        rulePriority: 50,
        suggestions: [],
      });
    }
  }

  return findings;
}
