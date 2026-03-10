import { useEffect, useRef, useState } from 'react';
import { sampleDraft } from './features/workspace/data/sampleDraft';
import { WorkspaceEditor } from './features/workspace/components/WorkspaceEditor';
import { WorkspaceSnapshot } from './features/workspace/components/WorkspaceSnapshot';
import { createLocalSnapshot } from './features/workspace/lib/createLocalSnapshot';
import type { AnalysisState } from './features/workspace/types';
import { getReadyLatencyMs } from './lib/bootMetrics';
import { createAnalysisWorkerClient } from './features/analysis/lib/createAnalysisWorkerClient';
import { createAnalysisScheduler } from './features/analysis/lib/createAnalysisScheduler';

export default function App() {
  const [draft, setDraft] = useState(sampleDraft);
  const [snapshot, setSnapshot] = useState(() => createLocalSnapshot(sampleDraft));
  const [analysisState, setAnalysisState] = useState<AnalysisState>('fresh');
  const [readyMs] = useState(() => getReadyLatencyMs());
  const schedulerRef = useRef<ReturnType<typeof createAnalysisScheduler> | null>(null);

  useEffect(() => {
    const client = createAnalysisWorkerClient();
    const scheduler = createAnalysisScheduler({
      client,
      onResult: (result) => {
        setSnapshot(result.snapshot);
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

  function handleDraftChange(nextDraft: string) {
    queueDraftAnalysis(nextDraft);
  }

  function handleAnalyze() {
    void schedulerRef.current?.flush(draft);
  }

  function handleLoadSample() {
    queueDraftAnalysis(sampleDraft);
  }

  function handleClear() {
    queueDraftAnalysis('');
  }

  return (
    <div className="app-shell">
      <header className="hero-panel panel">
        <p className="eyebrow">Phase 1 / Local Workspace Foundation</p>
        <div className="hero-copy">
          <div>
            <h1>Technical Writing Assistant</h1>
            <p className="hero-text">
              Draft faster with a single local workspace designed for technical writing. This foundation keeps
              everything in the browser and proves the analysis entry point without accounts, uploads, or cloud
              processing.
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
            onChange={handleDraftChange}
            onAnalyze={handleAnalyze}
            onClear={handleClear}
            onLoadSample={handleLoadSample}
          />
        </section>

        <aside className="panel snapshot-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">Analysis</p>
              <h2>Local-only first pass</h2>
            </div>
            <p className="panel-meta">No uploads</p>
          </div>

          <WorkspaceSnapshot snapshot={snapshot} analysisState={analysisState} readyMs={readyMs} />
        </aside>
      </main>
    </div>
  );
}
