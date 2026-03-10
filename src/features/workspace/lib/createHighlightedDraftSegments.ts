import type { DraftFinding } from '../../analysis/types';

export type HighlightedDraftSegment = {
  text: string;
  findingId: string | null;
  isActive: boolean;
};

export function createHighlightedDraftSegments({
  draft,
  findings,
  activeFindingId,
}: {
  draft: string;
  findings: DraftFinding[];
  activeFindingId: string | null;
}): HighlightedDraftSegment[] {
  const sortedFindings = [...findings].sort((left, right) => left.location.start - right.location.start || left.location.end - right.location.end);
  const segments: HighlightedDraftSegment[] = [];
  let cursor = 0;

  for (const finding of sortedFindings) {
    const start = Math.max(finding.location.start, cursor);
    const end = Math.max(start, finding.location.end);

    if (cursor < start) {
      segments.push({
        text: draft.slice(cursor, start),
        findingId: null,
        isActive: false,
      });
    }

    if (start < end) {
      segments.push({
        text: draft.slice(start, end),
        findingId: finding.id,
        isActive: finding.id === activeFindingId,
      });
      cursor = end;
    }
  }

  if (cursor < draft.length || draft.length === 0) {
    segments.push({
      text: draft.slice(cursor),
      findingId: null,
      isActive: false,
    });
  }

  return segments;
}
