/// <reference lib="webworker" />

import { createLocalSnapshot } from '../../workspace/lib/createLocalSnapshot';
import type { AnalysisJobError, AnalysisJobRequest, AnalysisJobResult, AnalysisWorkerError } from '../types';

declare const self: DedicatedWorkerGlobalScope;

function serializeWorkerError(error: unknown): AnalysisWorkerError {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    };
  }

  return {
    message: 'Unknown analysis worker failure.',
  };
}

self.onmessage = (event: MessageEvent<AnalysisJobRequest>) => {
  const request = event.data;

  try {
    const response: AnalysisJobResult = {
      type: 'analysis/result',
      requestId: request.requestId,
      queuedAt: request.queuedAt,
      completedAt: Date.now(),
      snapshot: createLocalSnapshot(request.draft),
    };

    self.postMessage(response);
  } catch (error) {
    const response: AnalysisJobError = {
      type: 'analysis/error',
      requestId: request.requestId,
      queuedAt: request.queuedAt,
      completedAt: Date.now(),
      error: serializeWorkerError(error),
    };

    self.postMessage(response);
  }
};

export {};
