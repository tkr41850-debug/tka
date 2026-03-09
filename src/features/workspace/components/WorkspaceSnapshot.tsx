import { formatSnapshotSummary } from '../lib/createLocalSnapshot';
import type { AnalysisState, LocalSnapshot } from '../types';

type WorkspaceSnapshotProps = {
  snapshot: LocalSnapshot;
  analysisState: AnalysisState;
  readyMs: number;
};

export function WorkspaceSnapshot({ snapshot, analysisState, readyMs }: WorkspaceSnapshotProps) {
  return (
    <div className="snapshot-stack">
      <div className="status-strip" aria-live="polite">
        {analysisState === 'fresh' ? 'Snapshot is current.' : 'Draft changed. Run a fresh local snapshot.'}
      </div>

      <div className="snapshot-summary">
        <p className="snapshot-label">Local snapshot</p>
        <h3>{formatSnapshotSummary(snapshot)}</h3>
        <p>
          This phase keeps analysis intentionally lightweight so the product can prove a browser-local handoff
          before rule warnings and rewrites arrive in later milestones.
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

      <ul className="note-list">
        <li>Nothing leaves this browser tab.</li>
        <li>Single source only: one active draft lives in memory at a time.</li>
        <li>Shell ready signal: {readyMs} ms on this device.</li>
      </ul>
    </div>
  );
}
