import { formatSnapshotSummary } from '../lib/createLocalSnapshot';
import type { DraftAnalysis } from '../../analysis/types';
import type { AnalysisState } from '../types';

type WorkspaceSnapshotProps = {
  analysis: DraftAnalysis;
  analysisState: AnalysisState;
  readyMs: number;
  activeFindingId: string | null;
  onSelectFinding: (findingId: string) => void;
};

function formatFindingConfidence(confidence: DraftAnalysis['findings'][number]['confidence']) {
  return confidence === 'heuristic' ? 'Likely' : 'Direct';
}

export function WorkspaceSnapshot({ analysis, analysisState, readyMs, activeFindingId, onSelectFinding }: WorkspaceSnapshotProps) {
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
          This phase adds a first-pass review list while keeping every check local to the browser and every
          freshness state explicit.
        </p>
      </div>

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
                  <button type="button" className="finding-button" onClick={() => onSelectFinding(finding.id)}>
                    <div className="finding-topline">
                      <span className="finding-severity">{finding.severity}</span>
                      <strong>{finding.ruleLabel}</strong>
                      <span className="finding-location">{finding.location.label}</span>
                    </div>
                    <p className="finding-explanation">{finding.explanation}</p>
                    <p className="finding-meta">{formatFindingConfidence(finding.confidence)} confidence match</p>
                    <blockquote>{finding.matchedText}</blockquote>
                  </button>
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
