import type { AnalysisState, DraftFinding } from '../../analysis/types';

type AnnouncementEvent =
  | { type: 'analysis-state'; analysisState: AnalysisState }
  | { type: 'finding-selected'; finding: DraftFinding }
  | { type: 'finding-dismissed'; finding: DraftFinding }
  | { type: 'dismissed-restored'; count: number }
  | { type: 'suggestion-applied'; finding: DraftFinding }
  | { type: 'rewrite-undone'; findingLabel: string }
  | { type: 'tutorial-opened' }
  | { type: 'tutorial-closed' };

export function createAnnouncementMessage(event: AnnouncementEvent): string {
  switch (event.type) {
    case 'analysis-state':
      switch (event.analysisState) {
        case 'fresh':
          return 'Analysis is current for the latest draft.';
        case 'error':
          return 'Background analysis failed. Refresh to try again.';
        default:
          return '';
      }
    case 'finding-selected':
      return `${event.finding.ruleLabel} selected at ${event.finding.location.label}. ${event.finding.confidence === 'heuristic' ? 'Likely' : 'Direct'} confidence.`;
    case 'finding-dismissed':
      return `${event.finding.ruleLabel} dismissed for this session only. The rule stays enabled.`;
    case 'dismissed-restored':
      return event.count === 1 ? '1 dismissed warning restored for this session.' : `${event.count} dismissed warnings restored for this session.`;
    case 'suggestion-applied':
      return `Suggestion applied for ${event.finding.ruleLabel}. Analysis refreshed for the updated draft.`;
    case 'rewrite-undone':
      return `Last rewrite undone. ${event.findingLabel} is available again.`;
    case 'tutorial-opened':
      return 'Quick tutorial opened.';
    case 'tutorial-closed':
      return 'Quick tutorial closed.';
  }
}
