import type { DraftFinding, FindingSuggestion } from '../../analysis/types';

export type RewriteSelection = {
  start: number;
  end: number;
};

export type RewriteUndoSnapshot = {
  draft: string;
  selection: RewriteSelection;
  findingId: string;
};

export type ApplySuggestedRewriteResult =
  | {
      ok: true;
      draft: string;
      selection: RewriteSelection;
      undoSnapshot: RewriteUndoSnapshot;
    }
  | {
      ok: false;
      reason: 'suggestion-not-applicable' | 'stale-offset';
    };

type ApplySuggestedRewriteOptions = {
  draft: string;
  finding: DraftFinding;
  suggestion: FindingSuggestion;
  selection?: RewriteSelection;
};

export function applySuggestedRewrite({
  draft,
  finding,
  suggestion,
  selection = { start: finding.location.start, end: finding.location.end },
}: ApplySuggestedRewriteOptions): ApplySuggestedRewriteResult {
  if (!suggestion.isAutoApplicable || suggestion.kind !== 'replace' || suggestion.replacementText === undefined) {
    return {
      ok: false,
      reason: 'suggestion-not-applicable',
    };
  }

  if (draft.slice(finding.location.start, finding.location.end) !== finding.matchedText) {
    return {
      ok: false,
      reason: 'stale-offset',
    };
  }

  const nextDraft =
    draft.slice(0, finding.location.start) + suggestion.replacementText + draft.slice(finding.location.end);
  const nextSelection = {
    start: finding.location.start,
    end: finding.location.start + suggestion.replacementText.length,
  };

  return {
    ok: true,
    draft: nextDraft,
    selection: nextSelection,
    undoSnapshot: {
      draft,
      selection,
      findingId: finding.id,
    },
  };
}

export function undoSuggestedRewrite({ draft, selection }: RewriteUndoSnapshot) {
  return {
    draft,
    selection,
  };
}
