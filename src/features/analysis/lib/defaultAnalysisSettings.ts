import type { AnalysisRuleId, AnalysisSettings } from '../types';

export const ANALYSIS_RULE_ORDER: AnalysisRuleId[] = [
  'long-sentence',
  'long-paragraph',
  'filler-phrase',
  'complex-wording',
  'passive-voice',
  'tense-drift',
  'custom-banned-phrase',
];

export const ANALYSIS_RULE_LABELS: Record<AnalysisRuleId, string> = {
  'long-sentence': 'Long sentence',
  'long-paragraph': 'Long paragraph',
  'filler-phrase': 'Wordy phrase',
  'complex-wording': 'Complex wording',
  'passive-voice': 'Likely passive voice',
  'tense-drift': 'Likely tense drift',
  'custom-banned-phrase': 'Custom banned phrase',
};

export const DEFAULT_ANALYSIS_SETTINGS: AnalysisSettings = {
  enabledRules: {
    'long-sentence': true,
    'long-paragraph': true,
    'filler-phrase': true,
    'complex-wording': true,
    'passive-voice': true,
    'tense-drift': true,
    'custom-banned-phrase': true,
  },
  thresholds: {
    sentenceWordLimit: 28,
    paragraphSentenceLimit: 6,
  },
  customBannedPhrases: [],
};
