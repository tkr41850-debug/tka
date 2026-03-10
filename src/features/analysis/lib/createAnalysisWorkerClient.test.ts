import type {
  AnalysisJobError,
  AnalysisJobRequest,
  AnalysisJobResponse,
  AnalysisJobResult,
} from '../types';
import { analyzeDraft } from './analyzeDraft';
import { AnalysisWorkerClientError, createAnalysisWorkerClient } from './createAnalysisWorkerClient';

type WorkerEvents = {
  error: ErrorEvent;
  message: MessageEvent<AnalysisJobResponse>;
  messageerror: MessageEvent;
};

class MockWorker {
  readonly postedMessages: AnalysisJobRequest[] = [];
  terminated = false;

  private readonly listeners = {
    error: [] as Array<(event: ErrorEvent) => void>,
    message: [] as Array<(event: MessageEvent<AnalysisJobResponse>) => void>,
    messageerror: [] as Array<(event: MessageEvent) => void>,
  };

  postMessage(message: AnalysisJobRequest) {
    this.postedMessages.push(message);
  }

  terminate() {
    this.terminated = true;
  }

  addEventListener<Key extends keyof WorkerEvents>(type: Key, listener: (event: WorkerEvents[Key]) => void) {
    switch (type) {
      case 'error':
        this.listeners.error.push(listener as (event: ErrorEvent) => void);
        break;
      case 'message':
        this.listeners.message.push(listener as (event: MessageEvent<AnalysisJobResponse>) => void);
        break;
      case 'messageerror':
        this.listeners.messageerror.push(listener as (event: MessageEvent) => void);
        break;
    }
  }

  removeEventListener<Key extends keyof WorkerEvents>(type: Key, listener: (event: WorkerEvents[Key]) => void) {
    switch (type) {
      case 'error':
        this.listeners.error = this.listeners.error.filter(
          (registeredListener) => registeredListener !== (listener as (event: ErrorEvent) => void),
        );
        break;
      case 'message':
        this.listeners.message = this.listeners.message.filter(
          (registeredListener) => registeredListener !== (listener as (event: MessageEvent<AnalysisJobResponse>) => void),
        );
        break;
      case 'messageerror':
        this.listeners.messageerror = this.listeners.messageerror.filter(
          (registeredListener) => registeredListener !== (listener as (event: MessageEvent) => void),
        );
        break;
    }
  }

  dispatchMessage(message: AnalysisJobResponse) {
    const event = { data: message } as MessageEvent<AnalysisJobResponse>;

    this.listeners.message.forEach((listener) => listener(event));
  }

  dispatchError(message = 'worker exploded') {
    const event = new ErrorEvent('error', { message });

    this.listeners.error.forEach((listener) => listener(event));
  }
}

function createJobRequest(overrides: Partial<AnalysisJobRequest> = {}): AnalysisJobRequest {
  return {
    requestId: overrides.requestId ?? 1,
    draft: overrides.draft ?? 'Draft text',
    queuedAt: overrides.queuedAt ?? 10,
  };
}

function createJobResult(request: AnalysisJobRequest): AnalysisJobResult {
  return {
    type: 'analysis/result',
    requestId: request.requestId,
    queuedAt: request.queuedAt,
    completedAt: request.queuedAt + 20,
    analysis: analyzeDraft(request.draft),
  };
}

function createJobError(request: AnalysisJobRequest): AnalysisJobError {
  return {
    type: 'analysis/error',
    requestId: request.requestId,
    queuedAt: request.queuedAt,
    completedAt: request.queuedAt + 20,
    error: {
      message: 'analysis failed',
      name: 'AnalysisError',
    },
  };
}

describe('createAnalysisWorkerClient', () => {
  it('posts typed requests to one persistent worker and resolves matching replies', async () => {
    const worker = new MockWorker();
    const createWorker = vi.fn(() => worker as unknown as Worker);
    const client = createAnalysisWorkerClient({ createWorker });
    const firstRequest = createJobRequest({ requestId: 1, draft: 'First draft' });
    const secondRequest = createJobRequest({ requestId: 2, draft: 'Second draft', queuedAt: 20 });

    const firstResultPromise = client.analyze(firstRequest);
    const secondResultPromise = client.analyze(secondRequest);

    expect(createWorker).toHaveBeenCalledTimes(1);
    expect(worker.postedMessages).toEqual([firstRequest, secondRequest]);

    worker.dispatchMessage(createJobResult(secondRequest));
    await expect(secondResultPromise).resolves.toEqual(createJobResult(secondRequest));

    worker.dispatchMessage(createJobResult(firstRequest));
    await expect(firstResultPromise).resolves.toEqual(createJobResult(firstRequest));
  });

  it('rejects job-specific worker failures with request metadata', async () => {
    const worker = new MockWorker();
    const client = createAnalysisWorkerClient({ createWorker: () => worker as unknown as Worker });
    const request = createJobRequest({ requestId: 7 });
    const resultPromise = client.analyze(request);

    worker.dispatchMessage(createJobError(request));

    await expect(resultPromise).rejects.toEqual(
      expect.objectContaining({
        name: 'AnalysisWorkerClientError',
        code: 'job-error',
        requestId: request.requestId,
        workerError: createJobError(request).error,
      }),
    );
  });

  it('terminates the worker and rejects in-flight work when disposed', async () => {
    const worker = new MockWorker();
    const client = createAnalysisWorkerClient({ createWorker: () => worker as unknown as Worker });
    const request = createJobRequest({ requestId: 3 });
    const resultPromise = client.analyze(request);

    client.dispose();

    expect(worker.terminated).toBe(true);
    await expect(resultPromise).rejects.toEqual(
      expect.objectContaining({
        name: 'AnalysisWorkerClientError',
        code: 'disposed',
        requestId: request.requestId,
      }),
    );
    await expect(client.analyze(createJobRequest({ requestId: 4 }))).rejects.toBeInstanceOf(AnalysisWorkerClientError);
  });

  it('rejects pending work cleanly when the worker crashes', async () => {
    const worker = new MockWorker();
    const client = createAnalysisWorkerClient({ createWorker: () => worker as unknown as Worker });
    const request = createJobRequest({ requestId: 5 });
    const resultPromise = client.analyze(request);

    worker.dispatchError('background crash');

    await expect(resultPromise).rejects.toEqual(
      expect.objectContaining({
        name: 'AnalysisWorkerClientError',
        code: 'worker-error',
        requestId: request.requestId,
        message: 'background crash',
      }),
    );
  });
});
