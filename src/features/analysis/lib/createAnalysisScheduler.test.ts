import type { AnalysisJobRequest, AnalysisJobResult, AnalysisLifecycle } from '../types';
import { analyzeDraft } from './analyzeDraft';
import { createAnalysisScheduler } from './createAnalysisScheduler';
import { DEFAULT_ANALYSIS_SETTINGS } from './defaultAnalysisSettings';

type DeferredResult = {
  request: AnalysisJobRequest;
  resolve: (result: AnalysisJobResult) => void;
  reject: (reason?: unknown) => void;
};

function createDeferredClient() {
  const pending = new Map<number, DeferredResult>();

  return {
    pending,
    analyze: vi.fn((request: AnalysisJobRequest) => {
      let resolve!: (result: AnalysisJobResult) => void;
      let reject!: (reason?: unknown) => void;

      const promise = new Promise<AnalysisJobResult>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
      });

      pending.set(request.requestId, {
        request,
        resolve,
        reject,
      });

      return promise;
    }),
    dispose: vi.fn(),
  };
}

function createJobResult(request: AnalysisJobRequest): AnalysisJobResult {
  return {
    type: 'analysis/result',
    requestId: request.requestId,
    queuedAt: request.queuedAt,
    completedAt: request.queuedAt + 50,
    analysis: analyzeDraft(request.draft, request.settings),
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('createAnalysisScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces queued drafts and dispatches only the newest draft', async () => {
    const client = createDeferredClient();
    const onStateChange = vi.fn<(state: AnalysisLifecycle) => void>();
    const scheduler = createAnalysisScheduler({
      client,
      delayMs: 300,
      onStateChange,
    });

    scheduler.queue('first draft', DEFAULT_ANALYSIS_SETTINGS);
    scheduler.queue('second draft', DEFAULT_ANALYSIS_SETTINGS);

    expect(client.analyze).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(300);

    expect(client.analyze).toHaveBeenCalledTimes(1);
    expect(client.analyze).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 2,
        draft: 'second draft',
      }),
    );
    expect(onStateChange).toHaveBeenNthCalledWith(1, expect.objectContaining({ state: 'queued', requestId: 1 }));
    expect(onStateChange).toHaveBeenNthCalledWith(2, expect.objectContaining({ state: 'queued', requestId: 2 }));
    expect(onStateChange).toHaveBeenNthCalledWith(3, expect.objectContaining({ state: 'running', requestId: 2 }));
  });

  it('flushes immediately and clears any pending debounce timer', async () => {
    const client = createDeferredClient();
    const scheduler = createAnalysisScheduler({
      client,
      delayMs: 300,
    });

    scheduler.queue('draft before flush', DEFAULT_ANALYSIS_SETTINGS);
    scheduler.flush('draft after flush', DEFAULT_ANALYSIS_SETTINGS);

    expect(client.analyze).toHaveBeenCalledTimes(1);
    expect(client.analyze).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 2,
        draft: 'draft after flush',
      }),
    );

    await vi.advanceTimersByTimeAsync(300);

    expect(client.analyze).toHaveBeenCalledTimes(1);
  });

  it('ignores stale results when a newer request has already been queued', async () => {
    const client = createDeferredClient();
    const onResult = vi.fn<(result: AnalysisJobResult) => void>();
    const onStateChange = vi.fn<(state: AnalysisLifecycle) => void>();
    const scheduler = createAnalysisScheduler({
      client,
      delayMs: 300,
      onResult,
      onStateChange,
    });

    scheduler.queue('first draft', DEFAULT_ANALYSIS_SETTINGS);
    await vi.advanceTimersByTimeAsync(300);

    const firstRequest = client.analyze.mock.calls[0][0] as AnalysisJobRequest;

    scheduler.queue('second draft', DEFAULT_ANALYSIS_SETTINGS);
    client.pending.get(firstRequest.requestId)?.resolve(createJobResult(firstRequest));
    await flushPromises();

    expect(onResult).not.toHaveBeenCalled();
    expect(onStateChange).not.toHaveBeenCalledWith(expect.objectContaining({ state: 'fresh', requestId: firstRequest.requestId }));

    await vi.advanceTimersByTimeAsync(300);

    const secondRequest = client.analyze.mock.calls[1][0] as AnalysisJobRequest;
    const secondResult = createJobResult(secondRequest);

    client.pending.get(secondRequest.requestId)?.resolve(secondResult);
    await flushPromises();

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(secondResult);
    expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ state: 'fresh', requestId: secondRequest.requestId }));
  });

  it('cleans up pending timers and disposes the worker client', async () => {
    const client = createDeferredClient();
    const scheduler = createAnalysisScheduler({
      client,
      delayMs: 300,
    });

    scheduler.queue('draft to discard', DEFAULT_ANALYSIS_SETTINGS);
    scheduler.dispose();

    await vi.advanceTimersByTimeAsync(300);

    expect(client.analyze).not.toHaveBeenCalled();
    expect(client.dispose).toHaveBeenCalledTimes(1);
  });
});
