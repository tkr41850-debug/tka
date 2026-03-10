import { useEffect, useRef, useState } from 'react';
import type { AnalysisSettings, AnalysisRuleId, DraftFinding, FindingSuggestion } from './features/analysis/types';
import { sampleDraft } from './features/workspace/data/sampleDraft';
import { WorkspaceEditor } from './features/workspace/components/WorkspaceEditor';
import { ReviewDetailPanel } from './features/workspace/components/ReviewDetailPanel';
import { RuleSettingsPanel } from './features/workspace/components/RuleSettingsPanel';
import { WorkspaceSnapshot } from './features/workspace/components/WorkspaceSnapshot';
import { analyzeDraft } from './features/analysis/lib/analyzeDraft';
import { DEFAULT_ANALYSIS_SETTINGS } from './features/analysis/lib/defaultAnalysisSettings';
import { normalizeAnalysisSettings } from './features/analysis/lib/normalizeAnalysisSettings';
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
  const [analysisSettings, setAnalysisSettings] = useState<AnalysisSettings>(() => DEFAULT_ANALYSIS_SETTINGS);
  const [analysis, setAnalysis] = useState(() => analyzeDraft(sampleDraft, DEFAULT_ANALYSIS_SETTINGS));
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

  function queueDraftAnalysis(nextDraft: string, nextSettings = analysisSettings) {
    setDraft(nextDraft);
    schedulerRef.current?.queue(nextDraft, nextSettings);
  }

  function flushDraftAnalysis(nextDraft: string, nextSettings = analysisSettings) {
    setDraft(nextDraft);
    void schedulerRef.current?.flush(nextDraft, nextSettings);
  }

  function updateAnalysisSettings(updater: (current: AnalysisSettings) => AnalysisSettings) {
    setUndoRewrite(null);
    setPendingSelection(null);
    setAnalysisSettings((current) => {
      const nextSettings = normalizeAnalysisSettings(updater(current));
      schedulerRef.current?.queue(draft, nextSettings);
      return nextSettings;
    });
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
    void schedulerRef.current?.flush(draft, analysisSettings);
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
    flushDraftAnalysis(result.draft, analysisSettings);
  }

  function handleUndoRewrite() {
    if (!undoRewrite) {
      return;
    }

    const restored = undoSuggestedRewrite(undoRewrite);
    setPendingSelection(restored.selection);
    setActiveFindingId(undoRewrite.findingId);
    setUndoRewrite(null);
    flushDraftAnalysis(restored.draft, analysisSettings);
  }

  function handleToggleRule(ruleId: AnalysisRuleId, enabled: boolean) {
    updateAnalysisSettings((current) => ({
      ...current,
      enabledRules: {
        ...current.enabledRules,
        [ruleId]: enabled,
      },
    }));
  }

  function handleThresholdChange(threshold: keyof AnalysisSettings['thresholds'], value: number) {
    updateAnalysisSettings((current) => ({
      ...current,
      thresholds: {
        ...current.thresholds,
        [threshold]: value,
      },
    }));
  }

  function handleAddPhrase(phrase: string) {
    updateAnalysisSettings((current) => ({
      ...current,
      customBannedPhrases: [...current.customBannedPhrases, phrase],
    }));
  }

  function handleRemovePhrase(phrase: string) {
    updateAnalysisSettings((current) => ({
      ...current,
      customBannedPhrases: current.customBannedPhrases.filter((candidate) => candidate !== phrase),
    }));
  }

  useEffect(() => {
    if (analysisState === 'fresh' && activeFindingId && !analysis.findings.some((finding) => finding.id === activeFindingId)) {
      setActiveFindingId(null);
    }
  }, [activeFindingId, analysis.findings, analysisState]);

  return (
    <div className="app-shell">
      <header className="hero-panel panel">
          <p className="eyebrow">Phase 5 / Rule Tuning and Custom Detection</p>
        <div className="hero-copy">
          <div>
            <h1>Technical Writing Assistant</h1>
            <p className="hero-text">
               Tune the active rule pack, retune thresholds, and add in-session banned phrases while every
               background review stays local to this browser.
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
            settings={analysisSettings}
            onSelectFinding={selectFinding}
          />

          <RuleSettingsPanel
            settings={analysisSettings}
            analysisState={analysisState}
            onToggleRule={handleToggleRule}
            onThresholdChange={handleThresholdChange}
            onAddPhrase={handleAddPhrase}
            onRemovePhrase={handleRemovePhrase}
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
