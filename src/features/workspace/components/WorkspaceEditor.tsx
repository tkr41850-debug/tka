import { useEffect, useMemo, useRef } from 'react';
import type { DraftFinding } from '../../analysis/types';
import type { AnalysisState } from '../types';
import { createHighlightedDraftSegments } from '../lib/createHighlightedDraftSegments';

type WorkspaceEditorProps = {
  value: string;
  draftCharacters: number;
  analysisState: AnalysisState;
  findings: DraftFinding[];
  activeFindingId: string | null;
  pendingSelection?: { start: number; end: number } | null;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onLoadSample: () => void;
  onSelectFinding: (findingId: string | null) => void;
  onPendingSelectionHandled: () => void;
};

export function WorkspaceEditor({
  value,
  draftCharacters,
  analysisState,
  findings,
  activeFindingId,
  pendingSelection,
  onChange,
  onAnalyze,
  onClear,
  onLoadSample,
  onSelectFinding,
  onPendingSelectionHandled,
}: WorkspaceEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mirrorRef = useRef<HTMLPreElement | null>(null);
  const activeFinding = findings.find((finding) => finding.id === activeFindingId) ?? null;
  const segments = useMemo(
    () => createHighlightedDraftSegments({ draft: value, findings, activeFindingId }),
    [activeFindingId, findings, value],
  );

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

  useEffect(() => {
    if (!textareaRef.current || !pendingSelection) {
      return;
    }

    textareaRef.current.focus({ preventScroll: false });
    textareaRef.current.setSelectionRange(pendingSelection.start, pendingSelection.end);
    onPendingSelectionHandled();
  }, [onPendingSelectionHandled, pendingSelection]);

  function syncMirrorScroll() {
    if (!textareaRef.current || !mirrorRef.current) {
      return;
    }

    mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
    mirrorRef.current.scrollLeft = textareaRef.current.scrollLeft;
  }

  function handleSelectionSync() {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const cursor = textarea.selectionStart;
    const matchingFinding = findings.find((finding) => cursor >= finding.location.start && cursor <= finding.location.end);
    onSelectFinding(matchingFinding?.id ?? null);
  }

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

      <div className="workspace-editor-frame">
        <pre className="workspace-highlight-layer" aria-hidden="true" ref={mirrorRef}>
          {segments.map((segment, index) =>
            segment.findingId ? (
              <mark
                key={`${segment.findingId}-${index}`}
                className={segment.isActive ? 'workspace-highlight is-active' : 'workspace-highlight'}
              >
                {segment.text || ' '}
              </mark>
            ) : (
              <span key={`plain-${index}`}>{segment.text || ' '}</span>
            ),
          )}
          {value.endsWith('\n') ? ' ' : null}
        </pre>

        <textarea
          id="workspace-input"
          ref={textareaRef}
          className="workspace-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={syncMirrorScroll}
          onClick={handleSelectionSync}
          onKeyUp={handleSelectionSync}
          onSelect={handleSelectionSync}
          placeholder="Paste technical writing here, or start drafting directly in the browser."
          spellCheck
        />
      </div>

      {activeFinding ? <p className="workspace-active-finding">Active review span: {activeFinding.location.label}.</p> : null}

      <p className="workspace-hint">
        Paste, type, or replace one draft. Nothing leaves this browser tab, and no account is required.
      </p>
    </div>
  );
}
