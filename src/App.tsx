import { useEffect, useRef, useState } from 'react';
import type { DraftFinding, FindingSuggestion } from './features/analysis/types';
import { sampleDraft } from './features/workspace/data/sampleDraft';
import { WorkspaceEditor } from './features/workspace/components/WorkspaceEditor';
import { ReviewDetailPanel } from './features/workspace/components/ReviewDetailPanel';
import { WorkspaceSnapshot } from './features/workspace/components/WorkspaceSnapshot';
import { analyzeDraft } from './features/analysis/lib/analyzeDraft';
import type { AnalysisState } from './features/workspace/types';
import { getReadyLatencyMs } from './lib/bootMetrics';
import { createAnalysisWorkerClient } from './features/analysis/lib/createAnalysisWorkerClient';
import { createAnalysisScheduler } from './features/analysis/lib/createAnalysisScheduler';
import {
  applySuggestedRewrite,
  type RewriteSelection,
  type RewriteUndoSnapshot,
  undoSuggestedRewrite,
} from './features/workspace/lib/applySuggestedRewrite';

export default function App() {
  const [draft, setDraft] = useState(sampleDraft);
  const [analysis, setAnalysis] = useState(() => analyzeDraft(sampleDraft));
  const [analysisState, setAnalysisState] = useState<AnalysisState>('fresh');
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<RewriteSelection | null>(null);
  const [undoRewrite, setUndoRewrite] = useState<RewriteUndoSnapshot | null>(null);
  const [readyMs] = useState(() => getReadyLatencyMs());
  const schedulerRef = useRef<ReturnType<typeof createAnalysisScheduler> | null>(null);

  const activeFinding = analysis.findings.find((finding) => finding.id === activeFindingId) ?? null;

  useEffect(() => {
    const client = createAnalysisWorkerClient();
    const scheduler = createAnalysisScheduler({
      client,
      onResult: (result) => {
        setAnalysis(result.analysis);
      },
      onStateChange: (lifecycle) => {
        setAnalysisState(lifecycle.state);
      },
    });

    schedulerRef.current = scheduler;

    return () => {
      scheduler.dispose();
      schedulerRef.current = null;
    };
  }, []);

  function queueDraftAnalysis(nextDraft: string) {
    setDraft(nextDraft);
    schedulerRef.current?.queue(nextDraft);
  }

  function flushDraftAnalysis(nextDraft: string) {
    setDraft(nextDraft);
    void schedulerRef.current?.flush(nextDraft);
  }

  function selectFinding(nextFindingId: string | null) {
    setActiveFindingId(nextFindingId);

    if (!nextFindingId) {
      return;
    }

    const finding = analysis.findings.find((candidate) => candidate.id === nextFindingId);

    if (!finding) {
      return;
    }

    setPendingSelection({
      start: finding.location.start,
      end: finding.location.end,
    });
  }

  function handleDraftChange(nextDraft: string) {
    setUndoRewrite(null);
    setPendingSelection(null);
    queueDraftAnalysis(nextDraft);
  }

  function handleAnalyze() {
    void schedulerRef.current?.flush(draft);
  }

  function handleLoadSample() {
    setActiveFindingId(null);
    setUndoRewrite(null);
    queueDraftAnalysis(sampleDraft);
  }

  function handleClear() {
    setActiveFindingId(null);
    setUndoRewrite(null);
    queueDraftAnalysis('');
  }

  function handleApplySuggestion(finding: DraftFinding, suggestion: FindingSuggestion) {
    const result = applySuggestedRewrite({
      draft,
      finding,
      suggestion,
      selection: pendingSelection ?? { start: finding.location.start, end: finding.location.end },
    });

    if (!result.ok) {
      return;
    }

    setUndoRewrite(result.undoSnapshot);
    setPendingSelection(result.selection);
    setActiveFindingId(null);
    flushDraftAnalysis(result.draft);
  }

  function handleUndoRewrite() {
    if (!undoRewrite) {
      return;
    }

    const restored = undoSuggestedRewrite(undoRewrite);
    setPendingSelection(restored.selection);
    setActiveFindingId(undoRewrite.findingId);
    setUndoRewrite(null);
    flushDraftAnalysis(restored.draft);
  }

  useEffect(() => {
    if (analysisState === 'fresh' && activeFindingId && !analysis.findings.some((finding) => finding.id === activeFindingId)) {
      setActiveFindingId(null);
    }
  }, [activeFindingId, analysis.findings, analysisState]);

  return (
    <div className="app-shell">
      <header className="hero-panel panel">
        <p className="eyebrow">Phase 4 / Contextual Review and Guidance</p>
        <div className="hero-copy">
          <div>
            <h1>Technical Writing Assistant</h1>
            <p className="hero-text">
              Inspect each issue in place, jump straight to the flagged span, and apply supported local rewrites
              without leaving the textarea workflow or sending text off-device.
            </p>
          </div>

          <div className="hero-badges" aria-label="foundation status">
            <span className="badge">Single source workspace</span>
            <span className="badge">No sign-in</span>
            <span className="badge">Ready in {readyMs} ms</span>
          </div>
        </div>
      </header>

      <main className="workspace-layout">
        <section className="panel editor-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">Workspace</p>
              <h2>One document, one clear place to write</h2>
            </div>
            <p className="panel-meta">Paste, replace, analyze.</p>
          </div>

          <WorkspaceEditor
            value={draft}
            draftCharacters={draft.length}
            analysisState={analysisState}
            findings={analysis.findings}
            activeFindingId={activeFindingId}
            pendingSelection={pendingSelection}
            onChange={handleDraftChange}
            onAnalyze={handleAnalyze}
            onClear={handleClear}
            onLoadSample={handleLoadSample}
            onSelectFinding={selectFinding}
            onPendingSelectionHandled={() => setPendingSelection(null)}
          />
        </section>

        <aside className="panel snapshot-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">Analysis</p>
              <h2>Contextual review</h2>
            </div>
            <p className="panel-meta">Queued, explained, reversible</p>
          </div>

          <WorkspaceSnapshot
            analysis={analysis}
            analysisState={analysisState}
            readyMs={readyMs}
            activeFindingId={activeFindingId}
            onSelectFinding={selectFinding}
          />

          <ReviewDetailPanel
            finding={activeFinding}
            canUndo={undoRewrite !== null}
            onApplySuggestion={handleApplySuggestion}
            onUndo={handleUndoRewrite}
          />
        </aside>
      </main>
    </div>
  );
}
