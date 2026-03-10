import { ANALYSIS_RULE_ORDER, DEFAULT_ANALYSIS_SETTINGS } from './defaultAnalysisSettings';
import type { AnalysisRuleId, AnalysisSettings } from '../types';

const MIN_SENTENCE_WORD_LIMIT = 5;
const MAX_SENTENCE_WORD_LIMIT = 80;
const MIN_PARAGRAPH_SENTENCE_LIMIT = 1;
const MAX_PARAGRAPH_SENTENCE_LIMIT = 20;

function clampInteger(value: unknown, fallback: number, minimum: number, maximum: number) {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, Math.round(parsed)));
}

function normalizeRuleToggle(value: Partial<Record<AnalysisRuleId, boolean>> | undefined) {
  return ANALYSIS_RULE_ORDER.reduce<Record<AnalysisRuleId, boolean>>((accumulator, ruleId) => {
    accumulator[ruleId] = value?.[ruleId] ?? DEFAULT_ANALYSIS_SETTINGS.enabledRules[ruleId];
    return accumulator;
  }, {} as Record<AnalysisRuleId, boolean>);
}

function normalizeCustomBannedPhrases(phrases: string[] | undefined) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const phrase of phrases ?? []) {
    const trimmed = phrase.trim().replace(/\s+/g, ' ');

    if (!trimmed) {
      continue;
    }

    const dedupeKey = trimmed.toLowerCase();

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    normalized.push(trimmed);
  }

  return normalized;
}

export function normalizeAnalysisSettings(settings?: Partial<AnalysisSettings>): AnalysisSettings {
  return {
    enabledRules: normalizeRuleToggle(settings?.enabledRules),
    thresholds: {
      sentenceWordLimit: clampInteger(
        settings?.thresholds?.sentenceWordLimit,
        DEFAULT_ANALYSIS_SETTINGS.thresholds.sentenceWordLimit,
        MIN_SENTENCE_WORD_LIMIT,
        MAX_SENTENCE_WORD_LIMIT,
      ),
      paragraphSentenceLimit: clampInteger(
        settings?.thresholds?.paragraphSentenceLimit,
        DEFAULT_ANALYSIS_SETTINGS.thresholds.paragraphSentenceLimit,
        MIN_PARAGRAPH_SENTENCE_LIMIT,
        MAX_PARAGRAPH_SENTENCE_LIMIT,
      ),
    },
    customBannedPhrases: normalizeCustomBannedPhrases(settings?.customBannedPhrases),
  };
}
