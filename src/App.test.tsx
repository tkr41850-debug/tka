import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { sampleDraft } from './features/workspace/data/sampleDraft';
import { createLocalSnapshot, formatSnapshotSummary } from './features/workspace/lib/createLocalSnapshot';
import type { AnalysisJobRequest, AnalysisJobResult } from './features/analysis/types';

const workerClientMocks = vi.hoisted(() => {
  const pending = new Map<
    number,
    {
      request: AnalysisJobRequest;
      resolve: (result: AnalysisJobResult) => void;
      reject: (reason?: unknown) => void;
    }
  >();

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
});

vi.mock('./features/analysis/lib/createAnalysisWorkerClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./features/analysis/lib/createAnalysisWorkerClient')>();

  return {
    ...actual,
    createAnalysisWorkerClient: vi.fn(() => ({
      analyze: workerClientMocks.analyze,
      dispose: workerClientMocks.dispose,
    })),
  };
});

function createJobResult(request: AnalysisJobRequest): AnalysisJobResult {
  return {
    type: 'analysis/result',
    requestId: request.requestId,
    queuedAt: request.queuedAt,
    completedAt: request.queuedAt + 50,
    snapshot: createLocalSnapshot(request.draft),
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    workerClientMocks.pending.clear();
    workerClientMocks.analyze.mockClear();
    workerClientMocks.dispose.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the local-only shell on load', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /technical writing assistant/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /background analysis/i })).toBeInTheDocument();
    expect(screen.getByText(/single source workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/snapshot is current/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh now/i })).toBeInTheDocument();
  });

  it('queues background analysis after typing pauses while keeping the editor editable', async () => {
    const nextDraft = 'Ship the release today.';

    render(<App />);

    const editor = screen.getByLabelText(/single document workspace/i);
    const initialSummary = formatSnapshotSummary(createLocalSnapshot(sampleDraft));
    const nextSummary = formatSnapshotSummary(createLocalSnapshot(nextDraft));

    fireEvent.click(screen.getByRole('button', { name: /clear draft/i }));
    fireEvent.change(editor, { target: { value: nextDraft } });

    expect(editor).toHaveValue(nextDraft);
    expect(screen.getByText(/background refresh queued/i)).toBeInTheDocument();
    expect(screen.getByText(initialSummary)).toBeInTheDocument();
    expect(workerClientMocks.analyze).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(workerClientMocks.analyze).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/analysis is running for your latest draft/i)).toBeInTheDocument();

    const queuedRequest = workerClientMocks.analyze.mock.calls[0]?.[0] as AnalysisJobRequest | undefined;
    expect(queuedRequest?.draft).toBe(nextDraft);

    await act(async () => {
      workerClientMocks.pending.get(queuedRequest?.requestId ?? 0)?.resolve(createJobResult(queuedRequest as AnalysisJobRequest));
      await flushPromises();
    });

    expect(screen.getByText(nextSummary)).toBeInTheDocument();
    expect(screen.getByText(/snapshot is current/i)).toBeInTheDocument();
  });

  it('replaces the current draft with the starter memo', async () => {
    render(<App />);

    const editor = screen.getByLabelText(/single document workspace/i);

    fireEvent.click(screen.getByRole('button', { name: /clear draft/i }));
    fireEvent.click(screen.getByRole('button', { name: /replace with starter draft/i }));

    expect(editor).toHaveValue(sampleDraft);
    expect(screen.getByText(/background refresh queued/i)).toBeInTheDocument();
  });

  it('refreshes immediately and accepts only the newest result after quick edits', async () => {
    render(<App />);

    const editor = screen.getByLabelText(/single document workspace/i);
    const newestDraft = 'Newest draft wins.';
    const newestSummary = formatSnapshotSummary(createLocalSnapshot(newestDraft));

    fireEvent.change(editor, { target: { value: 'First draft.' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const firstRequest = workerClientMocks.analyze.mock.calls[0]?.[0] as AnalysisJobRequest;

    fireEvent.change(editor, { target: { value: newestDraft } });
    fireEvent.click(screen.getByRole('button', { name: /refresh now/i }));

    expect(workerClientMocks.analyze).toHaveBeenCalledTimes(2);

    const newestRequest = workerClientMocks.analyze.mock.calls[1]?.[0] as AnalysisJobRequest;
    expect(newestRequest.draft).toBe(newestDraft);

    await act(async () => {
      workerClientMocks.pending.get(firstRequest.requestId)?.resolve(createJobResult(firstRequest));
      await flushPromises();
    });

    expect(screen.queryByText('2 words across 1 sentence and 1 paragraph.')).not.toBeInTheDocument();
    expect(screen.getByText(/last accepted result while a newer refresh is pending/i)).toBeInTheDocument();

    await act(async () => {
      workerClientMocks.pending.get(newestRequest.requestId)?.resolve(createJobResult(newestRequest));
      await flushPromises();
    });

    expect(screen.getByText(newestSummary)).toBeInTheDocument();
    expect(screen.getByText(/matches the latest saved draft in memory/i)).toBeInTheDocument();
  });

  it('shows failed freshness guidance until the next refresh succeeds', async () => {
    render(<App />);

    const editor = screen.getByLabelText(/single document workspace/i);
    const recoveryDraft = 'Recover with a newer result.';
    const recoverySummary = formatSnapshotSummary(createLocalSnapshot(recoveryDraft));

    fireEvent.change(editor, { target: { value: recoveryDraft } });
    fireEvent.click(screen.getByRole('button', { name: /refresh now/i }));

    const failedRequest = workerClientMocks.analyze.mock.calls[0]?.[0] as AnalysisJobRequest;

    await act(async () => {
      workerClientMocks.pending.get(failedRequest.requestId)?.reject(new Error('Worker offline'));
      await flushPromises();
    });

    expect(screen.getByText(/background refresh failed/i)).toBeInTheDocument();
    expect(screen.getByText(/older than your latest draft because the newest refresh failed/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /refresh now/i }));

    const recoveryRequest = workerClientMocks.analyze.mock.calls[1]?.[0] as AnalysisJobRequest;

    await act(async () => {
      workerClientMocks.pending.get(recoveryRequest.requestId)?.resolve(createJobResult(recoveryRequest));
      await flushPromises();
    });

    expect(screen.getByText(recoverySummary)).toBeInTheDocument();
    expect(screen.getByText(/snapshot is current/i)).toBeInTheDocument();
  });
});
