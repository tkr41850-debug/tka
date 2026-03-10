import type { DraftFinding } from '../../analysis/types';

export function createDismissedFindingKey(finding: DraftFinding): string {
  return finding.id;
}
