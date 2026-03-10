import type { DraftFinding, FindingSuggestion } from '../../analysis/types';

type ReviewDetailPanelProps = {
  finding: DraftFinding | null;
  canUndo: boolean;
  onApplySuggestion: (finding: DraftFinding, suggestion: FindingSuggestion) => void;
  onUndo: () => void;
};

export function ReviewDetailPanel({ finding, canUndo, onApplySuggestion, onUndo }: ReviewDetailPanelProps) {
  if (!finding) {
    return (
      <section className="review-detail-panel" aria-labelledby="review-detail-heading">
        <div className="review-detail-empty">
          <p className="snapshot-label">Review detail</p>
          <h3 id="review-detail-heading">Select an issue to inspect it in context</h3>
          <p>Choose any finding from the review list to jump to the exact span, read why it fired, and use supported guidance.</p>
        </div>
        <button type="button" className="button-secondary" onClick={onUndo} disabled={!canUndo}>
          Undo last rewrite
        </button>
      </section>
    );
  }

  return (
    <section className="review-detail-panel" aria-labelledby="review-detail-heading">
      <div className="review-detail-header">
        <div>
          <p className="snapshot-label">Review detail</p>
          <h3 id="review-detail-heading">{finding.ruleLabel}</h3>
        </div>
        <span className={`finding-severity finding-severity-${finding.severity}`}>{finding.severity}</span>
      </div>

      <p className="review-detail-location">{finding.location.label}</p>
      <p className="review-detail-copy">{finding.explanation}</p>
      {finding.ruleId === 'custom-banned-phrase' ? (
        <p className="review-detail-copy">This phrase comes from your current session list, so removing it from rule settings will clear this warning on the next refresh.</p>
      ) : null}
      <blockquote className="review-detail-quote">{finding.matchedText}</blockquote>

      {finding.suggestions.length > 0 ? (
        <div className="review-suggestions" aria-label="guided suggestions">
          {finding.suggestions.map((suggestion) => (
            <article key={suggestion.id} className="review-suggestion-card">
              <h4>{suggestion.label}</h4>
              <p>{suggestion.description}</p>
              <p className="review-suggestion-example">
                {suggestion.kind === 'replace' ? 'Suggested rewrite' : 'Example'}: {suggestion.exampleText}
              </p>
              {suggestion.isAutoApplicable && suggestion.replacementText !== undefined ? (
                <button type="button" className="button-primary" onClick={() => onApplySuggestion(finding, suggestion)}>
                  Apply suggestion
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="review-detail-copy">No direct rewrite is available for this heuristic warning yet.</p>
      )}

      <button type="button" className="button-secondary" onClick={onUndo} disabled={!canUndo}>
        Undo last rewrite
      </button>
    </section>
  );
}
