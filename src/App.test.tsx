import { act, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import { analyzeDraft } from './features/analysis/lib/analyzeDraft';
import { DEFAULT_ANALYSIS_SETTINGS } from './features/analysis/lib/defaultAnalysisSettings';
import { sampleDraft } from './features/workspace/data/sampleDraft';
import { formatSnapshotSummary } from './features/workspace/lib/createLocalSnapshot';
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
    analysis: analyzeDraft(request.draft, request.settings),
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
    expect(screen.getByRole('heading', { name: /contextual review/i })).toBeInTheDocument();
    expect(screen.getByText(/single source workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/snapshot is current/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh now/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /prioritized review/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /live tuning/i })).toBeInTheDocument();
  });

  it('queues background analysis after typing pauses while keeping the editor editable', async () => {
    const nextDraft = 'Ship the release today.';

    render(<App />);

    const editor = screen.getByLabelText(/single document workspace/i);
    const initialSummary = formatSnapshotSummary(analyzeDraft(sampleDraft).snapshot);
    const nextSummary = formatSnapshotSummary(analyzeDraft(nextDraft).snapshot);

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
    expect(queuedRequest?.settings).toEqual(DEFAULT_ANALYSIS_SETTINGS);

    await act(async () => {
      workerClientMocks.pending.get(queuedRequest?.requestId ?? 0)?.resolve(createJobResult(queuedRequest as AnalysisJobRequest));
      await flushPromises();
    });

    expect(screen.getByText(nextSummary)).toBeInTheDocument();
    expect(screen.getByText(/no core findings detected/i)).toBeInTheDocument();
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

  it('renders findings in priority order and accepts only the newest result after quick edits', async () => {
    render(<App />);

    const editor = screen.getByLabelText(/single document workspace/i);
    const firstDraft = 'Please note that the release will ship soon.';
    const newestDraft = 'This sentence intentionally keeps going so it crosses the default limit with many extra words that make the sentence harder to scan during a fast technical review for readers who need a shorter path.';
    const newestSummary = formatSnapshotSummary(analyzeDraft(newestDraft).snapshot);

    fireEvent.change(editor, { target: { value: firstDraft } });

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

    expect(screen.queryByRole('list', { name: /prioritized findings/i })).not.toBeInTheDocument();
    expect(screen.getByText(/last accepted result while a newer refresh is pending/i)).toBeInTheDocument();

    await act(async () => {
      workerClientMocks.pending.get(newestRequest.requestId)?.resolve(createJobResult(newestRequest));
      await flushPromises();
    });

    expect(screen.getByText(newestSummary)).toBeInTheDocument();
    expect(screen.getByText(/matches the latest saved draft in memory/i)).toBeInTheDocument();

    const list = screen.getByRole('list', { name: /prioritized findings/i });
    const items = within(list).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent(/long sentence/i);
  });

  it('shows failed freshness guidance until the next refresh succeeds', async () => {
    render(<App />);

    const editor = screen.getByLabelText(/single document workspace/i);
    const recoveryDraft = 'Recover with a newer result.';
    const recoverySummary = formatSnapshotSummary(analyzeDraft(recoveryDraft).snapshot);

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

  it('navigates from a finding to the editor and shows detail guidance', async () => {
    const draft = 'Please note that we utilize direct verbs.';
    const setSelectionRangeSpy = vi.spyOn(HTMLTextAreaElement.prototype, 'setSelectionRange');

    render(<App />);

    fireEvent.change(screen.getByLabelText(/single document workspace/i), { target: { value: draft } });
    fireEvent.click(screen.getByRole('button', { name: /refresh now/i }));

    const request = workerClientMocks.analyze.mock.calls[0]?.[0] as AnalysisJobRequest;

    await act(async () => {
      workerClientMocks.pending.get(request.requestId)?.resolve(createJobResult(request));
      await flushPromises();
    });

    const list = screen.getByRole('list', { name: /prioritized findings/i });
    const complexWordingButton = within(list)
      .getAllByRole('button')
      .find((button) => button.textContent?.match(/complex wording/i));

    expect(complexWordingButton).toBeTruthy();

    fireEvent.click(complexWordingButton as HTMLElement);

    expect(screen.getByRole('heading', { name: /complex wording/i })).toBeInTheDocument();
    expect(screen.getByText(/use "use" instead/i)).toBeInTheDocument();
    expect(screen.getByText(/active review span: sentence 1 in paragraph 1/i)).toBeInTheDocument();
    expect(setSelectionRangeSpy).toHaveBeenCalled();

    setSelectionRangeSpy.mockRestore();
  });

  it('applies a supported suggestion, reanalyzes immediately, and supports one-step undo', async () => {
    const draft = 'We utilize a robust workflow.';

    render(<App />);

    const editor = screen.getByLabelText(/single document workspace/i);

    fireEvent.change(editor, { target: { value: draft } });
    fireEvent.click(screen.getByRole('button', { name: /refresh now/i }));

    const initialRequest = workerClientMocks.analyze.mock.calls[0]?.[0] as AnalysisJobRequest;

    await act(async () => {
      workerClientMocks.pending.get(initialRequest.requestId)?.resolve(createJobResult(initialRequest));
      await flushPromises();
    });

    const list = screen.getByRole('list', { name: /prioritized findings/i });
    const complexWordingButton = within(list)
      .getAllByRole('button')
      .find((button) => button.textContent?.match(/complex wording/i) && button.textContent?.match(/utilize/i));

    fireEvent.click(complexWordingButton as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: /apply suggestion/i }));

    expect(editor).toHaveValue('We use a robust workflow.');
    expect(workerClientMocks.analyze).toHaveBeenCalledTimes(2);

    const applyRequest = workerClientMocks.analyze.mock.calls[1]?.[0] as AnalysisJobRequest;

    await act(async () => {
      workerClientMocks.pending.get(applyRequest.requestId)?.resolve(createJobResult(applyRequest));
      await flushPromises();
    });

    expect(screen.queryByText(/utilize/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /undo last rewrite/i })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: /undo last rewrite/i }));

    expect(editor).toHaveValue('We utilize a robust workflow.');
    expect(workerClientMocks.analyze).toHaveBeenCalledTimes(3);

    const undoRequest = workerClientMocks.analyze.mock.calls[2]?.[0] as AnalysisJobRequest;

    await act(async () => {
      workerClientMocks.pending.get(undoRequest.requestId)?.resolve(createJobResult(undoRequest));
      await flushPromises();
    });

    expect(screen.getByRole('heading', { name: /complex wording/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('We utilize a robust workflow.')).toBeInTheDocument();
  });

  it('refreshes findings when rules are toggled or thresholds change', async () => {
    const draft = 'Please note that this sentence intentionally keeps going so it crosses the default limit with many extra words that make the sentence harder to scan during a technical review.';

    render(<App />);

    fireEvent.change(screen.getByLabelText(/single document workspace/i), { target: { value: draft } });
    fireEvent.click(screen.getByRole('button', { name: /refresh now/i }));

    const initialRequest = workerClientMocks.analyze.mock.calls[0]?.[0] as AnalysisJobRequest;

    await act(async () => {
      workerClientMocks.pending.get(initialRequest.requestId)?.resolve(createJobResult(initialRequest));
      await flushPromises();
    });

    const findingsList = screen.getByRole('list', { name: /prioritized findings/i });
    expect(within(findingsList).getByText(/wordy phrase/i)).toBeInTheDocument();
    expect(within(findingsList).getByText(/long sentence/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: /wordy phrase/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const toggleRequest = workerClientMocks.analyze.mock.calls[1]?.[0] as AnalysisJobRequest;

    await act(async () => {
      workerClientMocks.pending.get(toggleRequest.requestId)?.resolve(createJobResult(toggleRequest));
      await flushPromises();
    });

    expect(within(screen.getByRole('list', { name: /prioritized findings/i })).queryByText(/wordy phrase/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('spinbutton', { name: /sentence word limit/i }), { target: { value: '60' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const thresholdRequest = workerClientMocks.analyze.mock.calls[2]?.[0] as AnalysisJobRequest;

    await act(async () => {
      workerClientMocks.pending.get(thresholdRequest.requestId)?.resolve(createJobResult(thresholdRequest));
      await flushPromises();
    });

    expect(screen.queryByRole('list', { name: /prioritized findings/i })).not.toBeInTheDocument();
    expect(screen.getByText(/no core findings detected/i)).toBeInTheDocument();
  });

  it('adds and removes custom banned phrases through the live settings panel', async () => {
    const draft = 'Avoid blocker wording in this blocker-ready draft.';

    render(<App />);

    fireEvent.change(screen.getByLabelText(/single document workspace/i), { target: { value: draft } });
    fireEvent.change(screen.getByPlaceholderText(/add a project-specific banned phrase/i), { target: { value: ' blocker ' } });
    fireEvent.click(screen.getByRole('button', { name: /add phrase/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const addRequest = workerClientMocks.analyze.mock.calls[0]?.[0] as AnalysisJobRequest;
    expect(addRequest.settings.customBannedPhrases).toEqual(['blocker']);

    await act(async () => {
      workerClientMocks.pending.get(addRequest.requestId)?.resolve(createJobResult(addRequest));
      await flushPromises();
    });

    const list = screen.getByRole('list', { name: /prioritized findings/i });
    const customPhraseButton = within(list)
      .getAllByRole('button')
      .find((button) => button.textContent?.match(/custom banned phrase/i));

    fireEvent.click(customPhraseButton as HTMLElement);

    expect(screen.getByText(/comes from your current session list/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const removeRequest = workerClientMocks.analyze.mock.calls[1]?.[0] as AnalysisJobRequest;
    expect(removeRequest.settings.customBannedPhrases).toEqual([]);

    await act(async () => {
      workerClientMocks.pending.get(removeRequest.requestId)?.resolve(createJobResult(removeRequest));
      await flushPromises();
    });

    expect(screen.queryByRole('list', { name: /prioritized findings/i })).not.toBeInTheDocument();
    expect(screen.getByText(/no core findings detected/i)).toBeInTheDocument();
  });

  it('opens a first-run tutorial, lets users skip or finish it, and supports reopening', () => {
    render(<App />);

    expect(screen.getByRole('dialog', { name: /start with highlighted review spans/i })).toBeInTheDocument();
    expect(document.activeElement).toHaveTextContent(/skip tutorial/i);

    fireEvent.click(screen.getByRole('button', { name: /skip tutorial/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toHaveTextContent(/reopen tutorial/i);

    fireEvent.click(screen.getByRole('button', { name: /reopen tutorial/i }));
    expect(screen.getByRole('dialog', { name: /start with highlighted review spans/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next tip/i }));
    expect(screen.getByRole('dialog', { name: /use the prioritized review list/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next tip/i }));
    expect(screen.getByRole('dialog', { name: /tune the live rule settings/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /finish tutorial/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('dismisses one warning without disabling its rule and restores dismissed warnings later', async () => {
    const draft = 'We utilize a robust workflow. We leverage a strong checklist.';

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /skip tutorial/i }));

    fireEvent.change(screen.getByLabelText(/single document workspace/i), { target: { value: draft } });
    fireEvent.click(screen.getByRole('button', { name: /refresh now/i }));

    const request = workerClientMocks.analyze.mock.calls[0]?.[0] as AnalysisJobRequest;

    await act(async () => {
      workerClientMocks.pending.get(request.requestId)?.resolve(createJobResult(request));
      await flushPromises();
    });

    const list = screen.getByRole('list', { name: /prioritized findings/i });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('checkbox', { name: /complex wording rule/i })).toBeChecked();

    fireEvent.click(within(list).getAllByRole('button', { name: /dismiss warning for complex wording/i })[0]);

    expect(within(screen.getByRole('list', { name: /prioritized findings/i })).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText(/1 warning hidden for this session only/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /complex wording rule/i })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent(/rule stays enabled/i);

    fireEvent.click(screen.getAllByRole('button', { name: /restore dismissed warnings/i })[0]);

    expect(within(screen.getByRole('list', { name: /prioritized findings/i })).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent(/dismissed warning restored/i);
  });

  it('shows explicit severity and confidence cues and announces review actions', async () => {
    const draft = 'We utilize a robust workflow.';

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /skip tutorial/i }));

    fireEvent.change(screen.getByLabelText(/single document workspace/i), { target: { value: draft } });
    fireEvent.click(screen.getByRole('button', { name: /refresh now/i }));

    const request = workerClientMocks.analyze.mock.calls[0]?.[0] as AnalysisJobRequest;

    await act(async () => {
      workerClientMocks.pending.get(request.requestId)?.resolve(createJobResult(request));
      await flushPromises();
    });

    const list = screen.getByRole('list', { name: /prioritized findings/i });
    const findingButton = within(list)
      .getAllByRole('button')
      .find((button) => button.textContent?.match(/complex wording/i) && button.textContent?.match(/severity: low/i));

    fireEvent.click(findingButton as HTMLElement);

    expect(screen.getAllByText(/severity: low/i).length).toBeGreaterThan(1);
    expect(screen.getAllByText(/direct confidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/keyboard tip: use tab to move between the review list/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/complex wording selected/i);

    fireEvent.click(screen.getByRole('button', { name: /apply suggestion/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/suggestion applied for complex wording/i);
  });
});
