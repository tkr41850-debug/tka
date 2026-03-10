import { useEffect, useRef, useState } from 'react';
import type { AnalysisSettings, AnalysisRuleId, DraftFinding, FindingSuggestion } from './features/analysis/types';
import { sampleDraft } from './features/workspace/data/sampleDraft';
import { WorkspaceEditor } from './features/workspace/components/WorkspaceEditor';
import { ReviewDetailPanel } from './features/workspace/components/ReviewDetailPanel';
import { RuleSettingsPanel } from './features/workspace/components/RuleSettingsPanel';
import { WorkspaceSnapshot } from './features/workspace/components/WorkspaceSnapshot';
import { FirstRunTutorial } from './features/workspace/components/FirstRunTutorial';
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
import { createDismissedFindingKey } from './features/workspace/lib/createDismissedFindingKey';
import { createAnnouncementMessage } from './features/workspace/lib/createAnnouncementMessage';

const TUTORIAL_STEPS = [
  {
    id: 'highlights',
    title: 'Start with highlighted review spans',
    body: 'The editor keeps your draft local and underlines review spans so you can see where each warning starts before you change anything.',
  },
  {
    id: 'review',
    title: 'Use the prioritized review list',
    body: 'Select a warning to jump to its exact location, read why it fired, and dismiss that one warning if it is not useful right now.',
  },
  {
    id: 'settings',
    title: 'Tune the live rule settings',
    body: 'Turn rules on or off, adjust length limits, and add custom banned phrases. Every refresh still runs only in this browser.',
  },
] as const;

export default function App() {
  const [draft, setDraft] = useState(sampleDraft);
  const [analysisSettings, setAnalysisSettings] = useState<AnalysisSettings>(() => DEFAULT_ANALYSIS_SETTINGS);
  const [analysis, setAnalysis] = useState(() => analyzeDraft(sampleDraft, DEFAULT_ANALYSIS_SETTINGS));
  const [analysisState, setAnalysisState] = useState<AnalysisState>('fresh');
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<RewriteSelection | null>(null);
  const [undoRewrite, setUndoRewrite] = useState<RewriteUndoSnapshot | null>(null);
  const [dismissedFindingKeys, setDismissedFindingKeys] = useState<Set<string>>(() => new Set());
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [readyMs] = useState(() => getReadyLatencyMs());
  const schedulerRef = useRef<ReturnType<typeof createAnalysisScheduler> | null>(null);
  const hasMountedRef = useRef(false);
  const tutorialReturnFocusRef = useRef<HTMLElement | null>(null);
  const tutorialButtonRef = useRef<HTMLButtonElement | null>(null);

  const visibleFindings = analysis.findings.filter((finding) => !dismissedFindingKeys.has(createDismissedFindingKey(finding)));
  const activeFinding = visibleFindings.find((finding) => finding.id === activeFindingId) ?? null;

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

    const finding = visibleFindings.find((candidate) => candidate.id === nextFindingId);

    if (!finding) {
      return;
    }

    setPendingSelection({
      start: finding.location.start,
      end: finding.location.end,
    });
    setAnnouncementMessage(createAnnouncementMessage({ type: 'finding-selected', finding }));
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
    setAnnouncementMessage(createAnnouncementMessage({ type: 'suggestion-applied', finding }));
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
    setAnnouncementMessage(createAnnouncementMessage({ type: 'rewrite-undone', findingLabel: 'The previous finding' }));
    flushDraftAnalysis(restored.draft, analysisSettings);
  }

  function handleDismissFinding(finding: DraftFinding) {
    const dismissalKey = createDismissedFindingKey(finding);
    setDismissedFindingKeys((current) => {
      const next = new Set(current);
      next.add(dismissalKey);
      return next;
    });
    setActiveFindingId((current) => (current === finding.id ? null : current));
    setAnnouncementMessage(createAnnouncementMessage({ type: 'finding-dismissed', finding }));
  }

  function handleDismissFindingById(findingId: string) {
    const finding = visibleFindings.find((candidate) => candidate.id === findingId);

    if (!finding) {
      return;
    }

    handleDismissFinding(finding);
  }

  function handleRestoreDismissedFindings() {
    if (dismissedFindingKeys.size === 0) {
      return;
    }

    setDismissedFindingKeys(new Set());
    setAnnouncementMessage(createAnnouncementMessage({ type: 'dismissed-restored', count: dismissedFindingKeys.size }));
  }

  function openTutorial(trigger?: HTMLElement | null) {
    tutorialReturnFocusRef.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setTutorialStepIndex(0);
    setIsTutorialOpen(true);
    setAnnouncementMessage(createAnnouncementMessage({ type: 'tutorial-opened' }));
  }

  function closeTutorial() {
    setIsTutorialOpen(false);
    setAnnouncementMessage(createAnnouncementMessage({ type: 'tutorial-closed' }));
  }

  function handleTutorialNext() {
    setTutorialStepIndex((current) => Math.min(current + 1, TUTORIAL_STEPS.length - 1));
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
    if (analysisState === 'fresh' && activeFindingId && !visibleFindings.some((finding) => finding.id === activeFindingId)) {
      setActiveFindingId(null);
    }
  }, [activeFindingId, analysisState, visibleFindings]);

  useEffect(() => {
    setDismissedFindingKeys((current) => {
      const validKeys = new Set(analysis.findings.map((finding) => createDismissedFindingKey(finding)));
      const next = new Set(Array.from(current).filter((key) => validKeys.has(key)));
      return next.size === current.size ? current : next;
    });
  }, [analysis.findings]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const message = createAnnouncementMessage({ type: 'analysis-state', analysisState });
    if (message) {
      setAnnouncementMessage(message);
    }
  }, [analysisState]);

  useEffect(() => {
    if (isTutorialOpen) {
      return;
    }

    const nextFocus = tutorialReturnFocusRef.current ?? tutorialButtonRef.current;
    nextFocus?.focus();
  }, [isTutorialOpen]);

  return (
    <div className="app-shell">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcementMessage}
      </div>

      <FirstRunTutorial
        isOpen={isTutorialOpen}
        stepIndex={tutorialStepIndex}
        steps={[...TUTORIAL_STEPS]}
        onNext={handleTutorialNext}
        onSkip={closeTutorial}
        onFinish={closeTutorial}
      />

      <header className="hero-panel panel">
          <p className="eyebrow">Phase 6 / Trustworthy First-Run Access</p>
        <div className="hero-copy">
          <div>
            <h1>Technical Writing Assistant</h1>
            <p className="hero-text">
                Start with a short tour, review warnings with explicit trust cues, and dismiss one warning at a time while every background check stays local to this browser.
              </p>
          </div>

          <div className="hero-badges" aria-label="foundation status">
            <span className="badge">Single source workspace</span>
            <span className="badge">No sign-in</span>
            <button ref={tutorialButtonRef} type="button" className="badge badge-button" onClick={() => openTutorial(tutorialButtonRef.current)}>
              Reopen tutorial
            </button>
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
            findings={visibleFindings}
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
            analysis={{ ...analysis, findings: visibleFindings }}
            analysisState={analysisState}
            readyMs={readyMs}
            activeFindingId={activeFindingId}
            settings={analysisSettings}
            dismissedCount={dismissedFindingKeys.size}
            onSelectFinding={selectFinding}
            onDismissFinding={handleDismissFindingById}
            onRestoreDismissedFindings={handleRestoreDismissedFindings}
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
            dismissedCount={dismissedFindingKeys.size}
            onApplySuggestion={handleApplySuggestion}
            onUndo={handleUndoRewrite}
            onDismiss={handleDismissFinding}
            onRestoreDismissedFindings={handleRestoreDismissedFindings}
          />
        </aside>
      </main>
    </div>
  );
}
