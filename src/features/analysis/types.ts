import type { AnalysisState, LocalSnapshot } from '../workspace/types';

export type { AnalysisState };

export type AnalysisJobRequest = {
  requestId: number;
  draft: string;
  queuedAt: number;
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
  snapshot: LocalSnapshot;
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
