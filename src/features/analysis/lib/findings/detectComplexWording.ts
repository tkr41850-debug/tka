import type { DraftFinding } from '../../types';
import type { ParsedDraft } from '../parseDraft';

const COMPLEX_WORDING_RULES = [
  {
    phrase: 'utilize',
    replacement: 'use',
    explanation: '"utilize" often sounds heavier than needed. A simpler verb usually reads faster.',
  },
  {
    phrase: 'leverage',
    replacement: 'use',
    explanation: '"leverage" can feel like business jargon when a plain verb would be clearer.',
  },
  {
    phrase: 'facilitate',
    replacement: 'help',
    explanation: '"facilitate" is often harder to scan than a direct verb such as "help".',
  },
  {
    phrase: 'robust',
    replacement: 'strong',
    explanation: '"robust" can be vague. A plainer adjective can make the claim easier to trust.',
  },
  {
    phrase: 'synergy',
    replacement: 'coordination',
    explanation: '"synergy" is often vague jargon. Name the simpler relationship when you can.',
  },
] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createSentenceLabel(sentenceNumber: number, paragraphNumber: number) {
  return `Sentence ${sentenceNumber} in paragraph ${paragraphNumber}`;
}

function matchReplacementCase(source: string, replacement: string) {
  if (source === source.toUpperCase()) {
    return replacement.toUpperCase();
  }

  if (source[0] === source[0]?.toUpperCase()) {
    return `${replacement[0]?.toUpperCase() ?? ''}${replacement.slice(1)}`;
  }

  return replacement;
}

export function detectComplexWording(parsedDraft: ParsedDraft): DraftFinding[] {
  const findings: DraftFinding[] = [];

  for (const rule of COMPLEX_WORDING_RULES) {
    const pattern = new RegExp(`\\b${escapeRegExp(rule.phrase)}\\b`, 'gi');

    for (const match of parsedDraft.text.matchAll(pattern)) {
      const start = match.index ?? 0;
      const matchedText = match[0];
      const end = start + matchedText.length;
      const sentence = parsedDraft.sentences.find((candidate) => start >= candidate.start && end <= candidate.end);

      if (!sentence) {
        continue;
      }

      const replacementText = matchReplacementCase(matchedText, rule.replacement);

      findings.push({
        id: '',
        ruleId: 'complex-wording',
        ruleLabel: 'Complex wording',
        severity: 'low',
        confidence: 'deterministic',
        explanation: rule.explanation,
        matchedText,
        location: {
          start,
          end,
          excerpt: sentence.text,
          label: createSentenceLabel(sentence.sentenceNumber, sentence.paragraphNumber),
          sentenceNumber: sentence.sentenceNumber,
          paragraphNumber: sentence.paragraphNumber,
        },
        rulePriority: 35,
        suggestions: [
          {
            id: `${rule.phrase}-plain-language`,
            label: `Use "${replacementText}" instead`,
            description: 'This direct replacement keeps the sentence meaning while using plainer wording.',
            kind: 'replace',
            exampleText: replacementText,
            replacementText,
            isAutoApplicable: true,
          },
        ],
      });
    }
  }

  return findings;
}
