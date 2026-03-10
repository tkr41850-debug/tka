import type { AnalysisSettings, DraftFinding } from '../../types';
import type { ParsedDraft } from '../parseDraft';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createSentenceLabel(sentenceNumber: number, paragraphNumber: number) {
  return `Sentence ${sentenceNumber} in paragraph ${paragraphNumber}`;
}

function createParagraphLabel(paragraphNumber: number) {
  return `Paragraph ${paragraphNumber}`;
}

export function detectCustomBannedPhrases(parsedDraft: ParsedDraft, settings: AnalysisSettings): DraftFinding[] {
  if (!settings.enabledRules['custom-banned-phrase'] || settings.customBannedPhrases.length === 0) {
    return [];
  }

  const findings: DraftFinding[] = [];

  for (const phrase of settings.customBannedPhrases) {
    const pattern = new RegExp(`\\b${escapeRegExp(phrase).replace(/ /g, '\\s+')}\\b`, 'gi');

    for (const match of parsedDraft.text.matchAll(pattern)) {
      const start = match.index ?? 0;
      const matchedText = match[0];
      const end = start + matchedText.length;
      const sentence = parsedDraft.sentences.find((candidate) => start >= candidate.start && end <= candidate.end);
      const paragraph = parsedDraft.paragraphs.find((candidate) => start >= candidate.start && end <= candidate.end);

      findings.push({
        id: '',
        ruleId: 'custom-banned-phrase',
        ruleLabel: 'Custom banned phrase',
        severity: 'medium',
        confidence: 'deterministic',
        explanation: `"${matchedText}" matches a custom banned phrase from this session's active rule settings. Replace it with a project-approved alternative if one exists.`,
        matchedText,
        location: {
          start,
          end,
          excerpt: sentence?.text ?? paragraph?.text ?? matchedText,
          label: sentence
            ? createSentenceLabel(sentence.sentenceNumber, sentence.paragraphNumber)
            : paragraph
              ? createParagraphLabel(paragraph.paragraphNumber)
              : 'Draft',
          sentenceNumber: sentence?.sentenceNumber,
          paragraphNumber: paragraph?.paragraphNumber,
        },
        rulePriority: 32,
        suggestions: [],
      });
    }
  }

  return findings;
}
