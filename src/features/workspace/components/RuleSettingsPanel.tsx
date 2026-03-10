import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ANALYSIS_RULE_LABELS, ANALYSIS_RULE_ORDER } from '../../analysis/lib/defaultAnalysisSettings';
import type { AnalysisSettings, AnalysisRuleId } from '../../analysis/types';
import type { AnalysisState } from '../types';

type RuleSettingsPanelProps = {
  settings: AnalysisSettings;
  analysisState: AnalysisState;
  onToggleRule: (ruleId: AnalysisRuleId, enabled: boolean) => void;
  onThresholdChange: (threshold: keyof AnalysisSettings['thresholds'], value: number) => void;
  onAddPhrase: (phrase: string) => void;
  onRemovePhrase: (phrase: string) => void;
};

const RULE_HELPERS: Record<AnalysisRuleId, string> = {
  'long-sentence': 'Flag sentences that run past the current word limit.',
  'long-paragraph': 'Flag paragraphs that stack too many sentences together.',
  'filler-phrase': 'Catch stock phrases that weaken direct instructions.',
  'complex-wording': 'Catch jargon or heavier wording when a simpler term exists.',
  'passive-voice': 'Keep heuristic passive-voice warnings available.',
  'tense-drift': 'Keep heuristic tense warnings available.',
  'custom-banned-phrase': 'Match phrases from your in-session custom watch list.',
};

export function RuleSettingsPanel({
  settings,
  analysisState,
  onToggleRule,
  onThresholdChange,
  onAddPhrase,
  onRemovePhrase,
}: RuleSettingsPanelProps) {
  const [phraseInput, setPhraseInput] = useState('');
  const normalizedPhraseInput = phraseInput.trim().replace(/\s+/g, ' ');
  const duplicatePhrase = settings.customBannedPhrases.some(
    (phrase) => phrase.toLowerCase() === normalizedPhraseInput.toLowerCase(),
  );
  const phraseError = !normalizedPhraseInput
    ? 'Enter a phrase to add it to this session.'
    : duplicatePhrase
      ? 'That phrase is already active for this session.'
      : null;
  const activeRuleCount = useMemo(
    () => ANALYSIS_RULE_ORDER.filter((ruleId) => settings.enabledRules[ruleId]).length,
    [settings.enabledRules],
  );

  function handlePhraseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (phraseError) {
      return;
    }

    onAddPhrase(normalizedPhraseInput);
    setPhraseInput('');
  }

  return (
    <section className="rule-settings-panel" aria-labelledby="rule-settings-heading">
      <div className="findings-header rule-settings-header">
        <div>
          <p className="snapshot-label">Rule settings</p>
          <h3 id="rule-settings-heading">Live tuning</h3>
        </div>
        <p className="panel-meta">{activeRuleCount} active rules</p>
      </div>

      <p className="rule-settings-copy">
        {analysisState === 'fresh'
          ? 'Current findings already reflect these settings.'
          : 'The review refreshes in the background as these settings change.'}
      </p>
      <p className="rule-settings-copy">Use native checkboxes and number fields to tune the local review without leaving the keyboard.</p>

      <div className="rule-settings-list" role="list" aria-label="rule settings">
        {ANALYSIS_RULE_ORDER.map((ruleId) => (
          <label key={ruleId} className="rule-toggle-card" role="listitem">
            <span>
              <strong>{ANALYSIS_RULE_LABELS[ruleId]}</strong>
              <span className="rule-toggle-helper">{RULE_HELPERS[ruleId]}</span>
            </span>
            <input
              type="checkbox"
              checked={settings.enabledRules[ruleId]}
              onChange={(event) => onToggleRule(ruleId, event.target.checked)}
              aria-label={`${ANALYSIS_RULE_LABELS[ruleId]} rule`}
            />
          </label>
        ))}
      </div>

      <div className="rule-threshold-grid">
        <label className="rule-threshold-field">
          <span>Sentence word limit</span>
          <input
            type="number"
            min={5}
            max={80}
            value={settings.thresholds.sentenceWordLimit}
            onChange={(event) => onThresholdChange('sentenceWordLimit', Number(event.target.value))}
            aria-describedby="rule-settings-heading"
          />
        </label>

        <label className="rule-threshold-field">
          <span>Paragraph sentence limit</span>
          <input
            type="number"
            min={1}
            max={20}
            value={settings.thresholds.paragraphSentenceLimit}
            onChange={(event) => onThresholdChange('paragraphSentenceLimit', Number(event.target.value))}
            aria-describedby="rule-settings-heading"
          />
        </label>
      </div>

      <div className="custom-phrase-panel">
        <div>
          <p className="snapshot-label">Custom banned phrase</p>
          <p className="rule-toggle-helper">This list applies only to the current in-memory session.</p>
        </div>

        <form className="custom-phrase-form" onSubmit={handlePhraseSubmit}>
          <input
            type="text"
            value={phraseInput}
            onChange={(event) => setPhraseInput(event.target.value)}
            placeholder="Add a project-specific banned phrase"
            aria-label="Custom banned phrase"
          />
          <button type="submit" className="button-primary" disabled={phraseError !== null}>
            Add phrase
          </button>
        </form>

        <p className="rule-settings-copy">{phraseError ?? 'Phrases match whole words case-insensitively.'}</p>

        {settings.customBannedPhrases.length === 0 ? (
          <p className="rule-settings-copy">No custom banned phrases are active yet.</p>
        ) : (
          <ul className="custom-phrase-list" aria-label="custom banned phrase list">
            {settings.customBannedPhrases.map((phrase) => (
              <li key={phrase}>
                <span>{phrase}</span>
                <button type="button" className="button-secondary" onClick={() => onRemovePhrase(phrase)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
