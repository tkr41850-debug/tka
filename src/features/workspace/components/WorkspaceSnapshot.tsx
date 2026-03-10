import { formatSnapshotSummary } from '../lib/createLocalSnapshot';
import type { AnalysisSettings, DraftAnalysis } from '../../analysis/types';
import type { AnalysisState } from '../types';

type WorkspaceSnapshotProps = {
  analysis: DraftAnalysis;
  analysisState: AnalysisState;
  readyMs: number;
  activeFindingId: string | null;
  settings: AnalysisSettings;
  dismissedCount: number;
  presetCount: number;
  tutorialCompleted: boolean;
  draftRecoveryEnabled: boolean;
  hasRecoverableDraft: boolean;
  onSelectFinding: (findingId: string) => void;
  onDismissFinding: (findingId: string) => void;
  onRestoreDismissedFindings: () => void;
};

function formatFindingConfidence(confidence: DraftAnalysis['findings'][number]['confidence']) {
  return confidence === 'heuristic' ? 'Likely' : 'Direct';
}

export function WorkspaceSnapshot({
  analysis,
  analysisState,
  readyMs,
  activeFindingId,
  settings,
  dismissedCount,
  presetCount,
  tutorialCompleted,
  draftRecoveryEnabled,
  hasRecoverableDraft,
  onSelectFinding,
  onDismissFinding,
  onRestoreDismissedFindings,
}: WorkspaceSnapshotProps) {
  const { snapshot, findings } = analysis;
  const statusLabel = analysisState === 'fresh' ? 'Current' : analysisState === 'error' ? 'Needs refresh' : analysisState;
  const statusMessage =
    analysisState === 'queued'
      ? 'Background analysis is queued for your latest draft.'
      : analysisState === 'running'
        ? 'Analysis is running for your latest draft.'
        : analysisState === 'error'
          ? 'Background analysis failed. Refresh to try again.'
          : analysisState === 'fresh'
            ? 'Snapshot is current.'
            : 'Draft changed since the last snapshot.';
  const freshnessCopy =
    analysisState === 'fresh'
      ? 'The visible analysis matches the latest saved draft in memory.'
      : analysisState === 'error'
        ? 'The visible analysis is older than your latest draft because the newest refresh failed.'
        : 'The visible analysis is still the last accepted result while a newer refresh is pending.';

  return (
    <div className="snapshot-stack">
      <div className={`status-strip analysis-status analysis-status-${analysisState}`} aria-live="polite">
        <span className="analysis-status-label">Background analysis · {statusLabel}</span>
        <span>{statusMessage}</span>
      </div>

      <div className="snapshot-summary">
        <p className="snapshot-label">Local snapshot</p>
        <h3>{formatSnapshotSummary(snapshot)}</h3>
        <p className="snapshot-freshness">{freshnessCopy}</p>
        <p>
          Live review stays local while active rules, length limits, presets, and same-browser continuity travel with each background refresh.
        </p>
      </div>

      <div className="status-strip rule-settings-summary" aria-label="active tuning summary">
        <span className="analysis-status-label">Active tuning</span>
        <span>
          Sentence limit {settings.thresholds.sentenceWordLimit} words · Paragraph limit {settings.thresholds.paragraphSentenceLimit}{' '}
          sentences
        </span>
        <span>
          {settings.customBannedPhrases.length === 0
            ? 'No custom banned phrases saved locally yet.'
            : `${settings.customBannedPhrases.length} custom banned phrase${settings.customBannedPhrases.length === 1 ? '' : 's'} active.`}
        </span>
      </div>

      <div className="status-strip continuity-summary" aria-label="same browser continuity summary">
        <span className="analysis-status-label">Same browser continuity</span>
        <span>
          {presetCount} preset{presetCount === 1 ? '' : 's'} saved locally. Tutorial {tutorialCompleted ? 'completed' : 'still available'}.
        </span>
        <span>
          Dismissed warnings stay on this browser only. Draft recovery is {draftRecoveryEnabled ? 'enabled' : 'off'}{hasRecoverableDraft ? ' and a saved draft is waiting for review.' : '.'}
        </span>
      </div>

      {dismissedCount > 0 ? (
        <div className="status-strip dismissed-summary" aria-label="dismissed warning summary">
          <span className="analysis-status-label">Session dismissals</span>
          <span>
            {dismissedCount} warning{dismissedCount === 1 ? '' : 's'} hidden on this same browser only. Their rules stay enabled.
          </span>
          <button type="button" className="button-secondary button-inline" onClick={onRestoreDismissedFindings}>
            Restore dismissed warnings
          </button>
        </div>
      ) : null}

      <div className="metric-grid" role="list" aria-label="snapshot metrics">
        <article className="metric-card" role="listitem">
          <span>Words</span>
          <strong>{snapshot.words}</strong>
        </article>
        <article className="metric-card" role="listitem">
          <span>Sentences</span>
          <strong>{snapshot.sentences}</strong>
        </article>
        <article className="metric-card" role="listitem">
          <span>Paragraphs</span>
          <strong>{snapshot.paragraphs}</strong>
        </article>
        <article className="metric-card" role="listitem">
          <span>Read time</span>
          <strong>{snapshot.readingMinutes} min</strong>
        </article>
      </div>

      <section className="findings-panel" aria-labelledby="core-findings-heading">
        <div className="findings-header">
          <div>
            <p className="snapshot-label">Core findings</p>
            <h3 id="core-findings-heading">Prioritized review</h3>
          </div>
          <p className="panel-meta">{findings.length === 0 ? 'Clean pass' : `${findings.length} issue${findings.length === 1 ? '' : 's'}`}</p>
        </div>

        {findings.length === 0 ? (
          <p className="findings-empty">No core findings detected in the current draft.</p>
        ) : (
            <ol className="findings-list" aria-label="prioritized findings">
              {findings.map((finding) => (
                <li key={finding.id} className={`finding finding-${finding.severity} ${finding.id === activeFindingId ? 'finding-active' : ''}`}>
                  <div className="finding-actions">
                    <button type="button" className="finding-button" onClick={() => onSelectFinding(finding.id)}>
                      <div className="finding-topline">
                        <span className={`finding-severity finding-severity-${finding.severity}`}>Severity: {finding.severity}</span>
                        <span className="finding-confidence">{formatFindingConfidence(finding.confidence)} confidence</span>
                        {finding.id === activeFindingId ? <span className="finding-active-label">Active</span> : null}
                      </div>
                      <div className="finding-topline">
                      <strong>{finding.ruleLabel}</strong>
                      <span className="finding-location">{finding.location.label}</span>
                      </div>
                      <p className="finding-explanation">{finding.explanation}</p>
                      <blockquote>{finding.matchedText}</blockquote>
                    </button>
                    <button
                      type="button"
                      className="button-secondary button-inline"
                      onClick={() => onDismissFinding(finding.id)}
                      aria-label={`Dismiss warning for ${finding.ruleLabel}`}
                    >
                      Dismiss warning
                    </button>
                  </div>
                </li>
              ))}
            </ol>
        )}
      </section>

      <ul className="note-list">
        <li>Nothing leaves this browser tab.</li>
        <li>Single source only: one active draft lives in memory at a time.</li>
        <li>Shell ready signal: {readyMs} ms on this device.</li>
      </ul>
    </div>
  );
}
