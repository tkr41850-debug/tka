import { createLocalSnapshot } from '../../workspace/lib/createLocalSnapshot';
import type { DraftAnalysis, DraftFinding, FindingSeverity } from '../types';
import { detectComplexWording } from './findings/detectComplexWording';
import { detectLengthAndWordiness } from './findings/detectLengthAndWordiness';
import { detectVoiceAndTense } from './findings/detectVoiceAndTense';
import { parseDraft } from './parseDraft';

const SEVERITY_PRIORITY: Record<FindingSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function compareFindings(left: DraftFinding, right: DraftFinding) {
  return (
    SEVERITY_PRIORITY[left.severity] - SEVERITY_PRIORITY[right.severity] ||
    left.rulePriority - right.rulePriority ||
    left.location.start - right.location.start ||
    left.location.end - right.location.end
  );
}

function attachFindingId(finding: Omit<DraftFinding, 'id'> | DraftFinding): DraftFinding {
  return {
    ...finding,
    id: `${finding.ruleId}:${finding.location.start}:${finding.location.end}`,
  };
}

export function analyzeDraft(text: string): DraftAnalysis {
  const parsedDraft = parseDraft(text);
  const findings = [
    ...detectLengthAndWordiness(parsedDraft),
    ...detectComplexWording(parsedDraft),
    ...detectVoiceAndTense(parsedDraft),
  ]
    .sort(compareFindings)
    .map(attachFindingId);

  return {
    snapshot: createLocalSnapshot(text),
    findings,
  };
}
