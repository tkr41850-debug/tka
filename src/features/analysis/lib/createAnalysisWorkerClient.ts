import type {
  AnalysisJobError,
  AnalysisJobRequest,
  AnalysisJobResponse,
  AnalysisJobResult,
  AnalysisWorkerError,
} from '../types';

type AnalysisWorkerInstance = Pick<Worker, 'postMessage' | 'terminate'> & {
  addEventListener(type: 'message', listener: (event: MessageEvent<AnalysisJobResponse>) => void): void;
  addEventListener(type: 'error', listener: (event: ErrorEvent) => void): void;
  addEventListener(type: 'messageerror', listener: (event: MessageEvent) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent<AnalysisJobResponse>) => void): void;
  removeEventListener(type: 'error', listener: (event: ErrorEvent) => void): void;
  removeEventListener(type: 'messageerror', listener: (event: MessageEvent) => void): void;
};

type AnalysisWorkerClientErrorCode = 'disposed' | 'job-error' | 'message-error' | 'worker-error';

type PendingRequest = {
  resolve: (result: AnalysisJobResult) => void;
  reject: (error: AnalysisWorkerClientError) => void;
};

export type CreateAnalysisWorkerClientOptions = {
  createWorker?: () => AnalysisWorkerInstance;
};

export type AnalysisWorkerClient = {
  analyze: (request: AnalysisJobRequest) => Promise<AnalysisJobResult>;
  dispose: () => void;
};

export class AnalysisWorkerClientError extends Error {
  readonly code: AnalysisWorkerClientErrorCode;
  readonly requestId: number;
  readonly workerError?: AnalysisWorkerError;

  constructor({
    code,
    message,
    requestId,
    workerError,
  }: {
    code: AnalysisWorkerClientErrorCode;
    message: string;
    requestId: number;
    workerError?: AnalysisWorkerError;
  }) {
    super(message);
    this.name = 'AnalysisWorkerClientError';
    this.code = code;
    this.requestId = requestId;
    this.workerError = workerError;
  }
}

function createDefaultWorker(): AnalysisWorkerInstance {
  return new Worker(new URL('../workers/localAnalysis.worker.ts', import.meta.url), {
    type: 'module',
  }) as AnalysisWorkerInstance;
}

function toAnalysisWorkerClientError({
  code,
  requestId,
  message,
  workerError,
}: {
  code: AnalysisWorkerClientErrorCode;
  requestId: number;
  message: string;
  workerError?: AnalysisWorkerError;
}) {
  return new AnalysisWorkerClientError({
    code,
    requestId,
    message,
    workerError,
  });
}

export function createAnalysisWorkerClient({ createWorker = createDefaultWorker }: CreateAnalysisWorkerClientOptions = {}): AnalysisWorkerClient {
  const worker = createWorker();
  const pendingRequests = new Map<number, PendingRequest>();
  let disposed = false;

  const rejectAll = ({
    code,
    message,
    workerError,
  }: {
    code: AnalysisWorkerClientErrorCode;
    message: string;
    workerError?: AnalysisWorkerError;
  }) => {
    for (const [requestId, request] of pendingRequests) {
      request.reject(
        toAnalysisWorkerClientError({
          code,
          requestId,
          message,
          workerError,
        }),
      );
    }

    pendingRequests.clear();
  };

  const handleMessage = (event: MessageEvent<AnalysisJobResponse>) => {
    const response = event.data;
    const pendingRequest = pendingRequests.get(response.requestId);

    if (!pendingRequest) {
      return;
    }

    pendingRequests.delete(response.requestId);

    if (response.type === 'analysis/result') {
      pendingRequest.resolve(response);
      return;
    }

    pendingRequest.reject(
      toAnalysisWorkerClientError({
        code: 'job-error',
        requestId: response.requestId,
        message: response.error.message,
        workerError: response.error,
      }),
    );
  };

  const handleError = (event: ErrorEvent) => {
    rejectAll({
      code: 'worker-error',
      message: event.message || 'Analysis worker failed.',
    });
  };

  const handleMessageError = () => {
    rejectAll({
      code: 'message-error',
      message: 'Analysis worker produced an unreadable message.',
    });
  };

  worker.addEventListener('message', handleMessage);
  worker.addEventListener('error', handleError);
  worker.addEventListener('messageerror', handleMessageError);

  return {
    analyze(request) {
      if (disposed) {
        return Promise.reject(
          toAnalysisWorkerClientError({
            code: 'disposed',
            requestId: request.requestId,
            message: 'Analysis worker client was disposed.',
          }),
        );
      }

      return new Promise<AnalysisJobResult>((resolve, reject) => {
        pendingRequests.set(request.requestId, {
          resolve,
          reject,
        });

        try {
          worker.postMessage(request);
        } catch (error) {
          pendingRequests.delete(request.requestId);

          const message = error instanceof Error ? error.message : 'Analysis worker request failed to send.';

          reject(
            toAnalysisWorkerClientError({
              code: 'worker-error',
              requestId: request.requestId,
              message,
            }),
          );
        }
      });
    },

    dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      worker.removeEventListener('messageerror', handleMessageError);
      rejectAll({
        code: 'disposed',
        message: 'Analysis worker client was disposed.',
      });
      worker.terminate();
    },
  };
}
