import type { AnalysisState } from '../types';

type WorkspaceEditorProps = {
  value: string;
  draftCharacters: number;
  analysisState: AnalysisState;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onLoadSample: () => void;
};

export function WorkspaceEditor({
  value,
  draftCharacters,
  analysisState,
  onChange,
  onAnalyze,
  onClear,
  onLoadSample,
}: WorkspaceEditorProps) {
  const editorStatusCopy =
    analysisState === 'queued'
      ? 'Background refresh queued. Keep typing while the current analysis stays visible.'
      : analysisState === 'running'
        ? 'Background analysis is running. You can keep editing while a fresher result is prepared.'
        : analysisState === 'error'
          ? 'Background refresh failed. The visible analysis is older than your latest draft until you refresh again.'
          : analysisState === 'fresh'
            ? 'Current draft and visible analysis match.'
            : 'Draft changed since the last snapshot.';

  return (
    <div className="workspace-stack">
      <div className="workspace-toolbar">
        <button type="button" className="button-secondary" onClick={onLoadSample}>
          Replace with starter draft
        </button>
        <button type="button" className="button-secondary" onClick={onClear}>
          Clear draft
        </button>
        <button type="button" className="button-primary" onClick={onAnalyze}>
          Refresh now
        </button>
      </div>

      <div className={`workspace-meta analysis-status analysis-status-${analysisState}`} aria-live="polite">
        <span>{editorStatusCopy}</span>
        <span>{draftCharacters} characters in the active document.</span>
      </div>

      <label className="workspace-label" htmlFor="workspace-input">
        Single document workspace
      </label>
      <textarea
        id="workspace-input"
        className="workspace-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste technical writing here, or start drafting directly in the browser."
        spellCheck
      />

      <p className="workspace-hint">
        Paste, type, or replace one draft. Nothing leaves this browser tab, and no account is required.
      </p>
    </div>
  );
}
