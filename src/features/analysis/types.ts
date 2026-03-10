import type { AnalysisState, LocalSnapshot } from '../workspace/types';

export type { AnalysisState };

export type FindingSeverity = 'high' | 'medium' | 'low';

export type FindingConfidence = 'deterministic' | 'heuristic';

export type AnalysisRuleId =
  | 'long-sentence'
  | 'long-paragraph'
  | 'filler-phrase'
  | 'complex-wording'
  | 'passive-voice'
  | 'tense-drift'
  | 'custom-banned-phrase';

export type AnalysisSettings = {
  enabledRules: Record<AnalysisRuleId, boolean>;
  thresholds: {
    sentenceWordLimit: number;
    paragraphSentenceLimit: number;
  };
  customBannedPhrases: string[];
};

export type DraftFindingLocation = {
  start: number;
  end: number;
  excerpt: string;
  label: string;
  sentenceNumber?: number;
  paragraphNumber?: number;
};

export type FindingSuggestion = {
  id: string;
  label: string;
  description: string;
  kind: 'replace' | 'example';
  exampleText: string;
  replacementText?: string;
  isAutoApplicable: boolean;
};

export type DraftFinding = {
  id: string;
  ruleId: AnalysisRuleId;
  ruleLabel: string;
  severity: FindingSeverity;
  confidence: FindingConfidence;
  explanation: string;
  matchedText: string;
  location: DraftFindingLocation;
  rulePriority: number;
  suggestions: FindingSuggestion[];
};

export type DraftAnalysis = {
  snapshot: LocalSnapshot;
  findings: DraftFinding[];
};

export type AnalysisJobRequest = {
  requestId: number;
  draft: string;
  queuedAt: number;
  settings: AnalysisSettings;
};

export type AnalysisWorkerError = {
  message: string;
  name?: string;
};

export type AnalysisJobResult = {
  type: 'analysis/result';
  requestId: number;
  queuedAt: number;
  completedAt: number;
  analysis: DraftAnalysis;
};

export type AnalysisJobError = {
  type: 'analysis/error';
  requestId: number;
  queuedAt: number;
  completedAt: number;
  error: AnalysisWorkerError;
};

export type AnalysisJobResponse = AnalysisJobResult | AnalysisJobError;

export type AnalysisLifecycle =
  | {
      state: 'stale';
    }
  | {
      state: 'queued';
      requestId: number;
      queuedAt: number;
    }
  | {
      state: 'running';
      requestId: number;
      queuedAt: number;
      startedAt: number;
    }
  | {
      state: 'fresh';
      requestId: number;
      queuedAt: number;
      completedAt: number;
    }
  | {
      state: 'error';
      requestId: number;
      queuedAt: number;
      completedAt: number;
      error: AnalysisWorkerError;
    };
