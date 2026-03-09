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
          Run local snapshot
        </button>
      </div>

      <div className="workspace-meta" aria-live="polite">
        <span>{analysisState === 'fresh' ? 'Current draft is in sync.' : 'Draft changed since the last snapshot.'}</span>
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
