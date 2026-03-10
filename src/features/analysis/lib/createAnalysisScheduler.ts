import type { AnalysisJobRequest, AnalysisJobResult, AnalysisLifecycle, AnalysisSettings, AnalysisWorkerError } from '../types';
import { AnalysisWorkerClientError } from './createAnalysisWorkerClient';
import type { AnalysisWorkerClient } from './createAnalysisWorkerClient';

export const DEFAULT_ANALYSIS_DELAY_MS = 300;

type AnalysisSchedulerClient = Pick<AnalysisWorkerClient, 'analyze' | 'dispose'>;

export type CreateAnalysisSchedulerOptions = {
  client: AnalysisSchedulerClient;
  delayMs?: number;
  now?: () => number;
  onResult?: (result: AnalysisJobResult) => void;
  onStateChange?: (state: AnalysisLifecycle) => void;
};

export type AnalysisScheduler = {
  queue: (draft: string, settings: AnalysisSettings) => number;
  flush: (draft: string, settings: AnalysisSettings) => Promise<void>;
  dispose: () => void;
};

function toWorkerError(error: unknown): AnalysisWorkerError {
  if (error instanceof AnalysisWorkerClientError && error.workerError) {
    return error.workerError;
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    };
  }

  return {
    message: 'Unknown analysis scheduler failure.',
  };
}

export function createAnalysisScheduler({
  client,
  delayMs = DEFAULT_ANALYSIS_DELAY_MS,
  now = () => Date.now(),
  onResult,
  onStateChange,
}: CreateAnalysisSchedulerOptions): AnalysisScheduler {
  let disposed = false;
  let latestRequestId = 0;
  let timerId: ReturnType<typeof setTimeout> | undefined;

  const createRequest = (draft: string, settings: AnalysisSettings): AnalysisJobRequest => {
    latestRequestId += 1;

    return {
      requestId: latestRequestId,
      draft,
      queuedAt: now(),
      settings,
    };
  };

  const clearPendingTimer = () => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
  };

  const acceptRequest = (requestId: number) => !disposed && requestId === latestRequestId;

  const runRequest = async (request: AnalysisJobRequest) => {
    if (disposed) {
      return;
    }

    onStateChange?.({
      state: 'running',
      requestId: request.requestId,
      queuedAt: request.queuedAt,
      startedAt: now(),
    });

    try {
      const result = await client.analyze(request);

      if (!acceptRequest(result.requestId)) {
        return;
      }

      onResult?.(result);
      onStateChange?.({
        state: 'fresh',
        requestId: result.requestId,
        queuedAt: result.queuedAt,
        completedAt: result.completedAt,
      });
    } catch (error) {
      const requestId = error instanceof AnalysisWorkerClientError ? error.requestId : request.requestId;

      if (!acceptRequest(requestId)) {
        return;
      }

      onStateChange?.({
        state: 'error',
        requestId,
        queuedAt: request.queuedAt,
        completedAt: now(),
        error: toWorkerError(error),
      });
    }
  };

  return {
    queue(draft, settings) {
      if (disposed) {
        return 0;
      }

      clearPendingTimer();

      const request = createRequest(draft, settings);

      onStateChange?.({
        state: 'queued',
        requestId: request.requestId,
        queuedAt: request.queuedAt,
      });

      timerId = setTimeout(() => {
        timerId = undefined;
        void runRequest(request);
      }, delayMs);

      return request.requestId;
    },

    async flush(draft, settings) {
      if (disposed) {
        return;
      }

      clearPendingTimer();

      const request = createRequest(draft, settings);
      await runRequest(request);
    },

    dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      clearPendingTimer();
      client.dispose();
    },
  };
}
