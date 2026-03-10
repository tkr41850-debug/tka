import type { DraftFinding } from '../../types';
import type { ParsedDraft } from '../parseDraft';

export const DEFAULT_SENTENCE_WORD_LIMIT = 28;
export const DEFAULT_PARAGRAPH_SENTENCE_LIMIT = 6;

const FILLER_PHRASES = [
  {
    phrase: 'in order to',
    replacement: 'to',
  },
  {
    phrase: 'please note',
    replacement: 'note',
  },
  {
    phrase: 'simply',
    replacement: '',
  },
  {
    phrase: 'just',
    replacement: '',
  },
  {
    phrase: 'at this point in time',
    replacement: 'now',
  },
  {
    phrase: 'due to the fact that',
    replacement: 'because',
  },
] as const;

function createSentenceLabel(sentenceNumber: number, paragraphNumber: number) {
  return `Sentence ${sentenceNumber} in paragraph ${paragraphNumber}`;
}

function createParagraphLabel(paragraphNumber: number) {
  return `Paragraph ${paragraphNumber}`;
}

export function detectLengthAndWordiness(parsedDraft: ParsedDraft): DraftFinding[] {
  const findings: DraftFinding[] = [];

  for (const sentence of parsedDraft.sentences) {
    if (sentence.wordCount > DEFAULT_SENTENCE_WORD_LIMIT) {
      findings.push({
        id: '',
        ruleId: 'long-sentence',
        ruleLabel: 'Long sentence',
        severity: 'high',
        confidence: 'deterministic',
        explanation: `This sentence has ${sentence.wordCount} words, which is over the default ${DEFAULT_SENTENCE_WORD_LIMIT}-word limit for easier scanning.`,
        matchedText: sentence.text,
        location: {
          start: sentence.start,
          end: sentence.end,
          excerpt: sentence.text,
          label: createSentenceLabel(sentence.sentenceNumber, sentence.paragraphNumber),
          sentenceNumber: sentence.sentenceNumber,
          paragraphNumber: sentence.paragraphNumber,
        },
        rulePriority: 10,
        suggestions: [],
      });
    }
  }

  for (const paragraph of parsedDraft.paragraphs) {
    if (paragraph.sentenceCount > DEFAULT_PARAGRAPH_SENTENCE_LIMIT) {
      findings.push({
        id: '',
        ruleId: 'long-paragraph',
        ruleLabel: 'Long paragraph',
        severity: 'medium',
        confidence: 'deterministic',
        explanation: `This paragraph has ${paragraph.sentenceCount} sentences, which is over the default ${DEFAULT_PARAGRAPH_SENTENCE_LIMIT}-sentence limit for technical writing.`,
        matchedText: paragraph.text,
        location: {
          start: paragraph.start,
          end: paragraph.end,
          excerpt: paragraph.text,
          label: createParagraphLabel(paragraph.paragraphNumber),
          paragraphNumber: paragraph.paragraphNumber,
        },
        rulePriority: 20,
        suggestions: [],
      });
    }
  }

  for (const phrase of FILLER_PHRASES) {
    const pattern = new RegExp(`\\b${phrase.phrase.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&').replace(/ /g, '\\s+')}\\b`, 'gi');

    for (const match of parsedDraft.text.matchAll(pattern)) {
      const start = match.index ?? 0;
      const matchedText = match[0];
      const end = start + matchedText.length;
      const sentence = parsedDraft.sentences.find((candidate) => start >= candidate.start && end <= candidate.end);
      const paragraph = parsedDraft.paragraphs.find((candidate) => start >= candidate.start && end <= candidate.end);
      const label = sentence
        ? createSentenceLabel(sentence.sentenceNumber, sentence.paragraphNumber)
        : paragraph
          ? createParagraphLabel(paragraph.paragraphNumber)
          : 'Draft';

      findings.push({
        id: '',
        ruleId: 'filler-phrase',
        ruleLabel: 'Wordy phrase',
        severity: 'medium',
        confidence: 'deterministic',
        explanation: `"${matchedText}" can make technical guidance feel less direct. Prefer a shorter, more specific phrase when possible.`,
        matchedText,
        location: {
          start,
          end,
          excerpt: sentence?.text ?? paragraph?.text ?? matchedText,
          label,
          sentenceNumber: sentence?.sentenceNumber,
          paragraphNumber: paragraph?.paragraphNumber,
        },
        rulePriority: 30,
        suggestions: [
          {
            id: `${phrase.phrase}-plain-language`,
            label: phrase.replacement ? `Use "${phrase.replacement}" instead` : 'Remove this extra wording',
            description: phrase.replacement
              ? 'This replacement keeps the sentence intent while cutting extra words.'
              : 'This phrase can usually be removed without losing the instruction.',
            kind: 'replace',
            exampleText: phrase.replacement || '(remove this phrase)',
            replacementText: phrase.replacement,
            isAutoApplicable: true,
          },
        ],
      });
    }
  }

  return findings;
}
