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

vi.mock('./features/analysis/lib/createAnalysisWorkerClient', () => ({
  createAnalysisWorkerClient: vi.fn(() => ({
    analyze: workerClientMocks.analyze,
    dispose: workerClientMocks.dispose,
  })),
}));

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
});
