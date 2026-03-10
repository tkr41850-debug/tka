import type { AnalysisState, DraftFinding } from '../../analysis/types';

type AnnouncementEvent =
  | { type: 'analysis-state'; analysisState: AnalysisState }
  | { type: 'finding-selected'; finding: DraftFinding }
  | { type: 'finding-dismissed'; finding: DraftFinding }
  | { type: 'dismissed-restored'; count: number }
  | { type: 'session-restored'; count: number }
  | { type: 'suggestion-applied'; finding: DraftFinding }
  | { type: 'rewrite-undone'; findingLabel: string }
  | { type: 'preset-saved'; name: string }
  | { type: 'preset-applied'; name: string }
  | { type: 'preset-renamed'; name: string }
  | { type: 'preset-deleted'; name: string }
  | { type: 'draft-recovery-enabled' }
  | { type: 'draft-recovery-disabled' }
  | { type: 'draft-restored' }
  | { type: 'draft-discarded' }
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
    case 'session-restored':
      return event.count === 1 ? '1 local preference restored on this browser.' : `${event.count} local preferences restored on this browser.`;
    case 'suggestion-applied':
      return `Suggestion applied for ${event.finding.ruleLabel}. Analysis refreshed for the updated draft.`;
    case 'rewrite-undone':
      return `Last rewrite undone. ${event.findingLabel} is available again.`;
    case 'preset-saved':
      return `Preset saved: ${event.name}.`;
    case 'preset-applied':
      return `Preset applied: ${event.name}. Analysis will refresh with those settings.`;
    case 'preset-renamed':
      return `Preset renamed to ${event.name}.`;
    case 'preset-deleted':
      return `Preset deleted: ${event.name}.`;
    case 'draft-recovery-enabled':
      return 'Draft recovery enabled for this browser.';
    case 'draft-recovery-disabled':
      return 'Draft recovery disabled and saved draft cleared for this browser.';
    case 'draft-restored':
      return 'Saved draft restored on this browser.';
    case 'draft-discarded':
      return 'Saved draft discarded on this browser.';
    case 'tutorial-opened':
      return 'Quick tutorial opened.';
    case 'tutorial-closed':
      return 'Quick tutorial closed.';
  }
}
