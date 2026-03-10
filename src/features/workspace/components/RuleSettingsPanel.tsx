import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ANALYSIS_RULE_LABELS, ANALYSIS_RULE_ORDER } from '../../analysis/lib/defaultAnalysisSettings';
import type { AnalysisSettings, AnalysisRuleId, SavedRulePreset } from '../../analysis/types';
import type { AnalysisState } from '../types';

type RuleSettingsPanelProps = {
  settings: AnalysisSettings;
  analysisState: AnalysisState;
  savedPresets: SavedRulePreset[];
  draftRecoveryEnabled: boolean;
  onToggleRule: (ruleId: AnalysisRuleId, enabled: boolean) => void;
  onThresholdChange: (threshold: keyof AnalysisSettings['thresholds'], value: number) => void;
  onAddPhrase: (phrase: string) => void;
  onRemovePhrase: (phrase: string) => void;
  onSavePreset: (name: string) => { ok: true } | { ok: false; reason: 'blank' | 'duplicate' };
  onApplyPreset: (presetId: string) => void;
  onRenamePreset: (presetId: string, name: string) => { ok: true } | { ok: false; reason: 'blank' | 'duplicate' };
  onDeletePreset: (presetId: string) => void;
  onToggleDraftRecovery: (enabled: boolean) => void;
};

const RULE_HELPERS: Record<AnalysisRuleId, string> = {
  'long-sentence': 'Flag sentences that run past the current word limit.',
  'long-paragraph': 'Flag paragraphs that stack too many sentences together.',
  'filler-phrase': 'Catch stock phrases that weaken direct instructions.',
  'complex-wording': 'Catch jargon or heavier wording when a simpler term exists.',
  'passive-voice': 'Keep heuristic passive-voice warnings available.',
  'tense-drift': 'Keep heuristic tense warnings available.',
  'custom-banned-phrase': 'Match phrases from your saved custom watch list.',
};

function formatPresetError(reason: 'blank' | 'duplicate' | null) {
  if (reason === 'blank') {
    return 'Enter a preset name before saving.';
  }

  if (reason === 'duplicate') {
    return 'That preset name is already saved on this browser.';
  }

  return 'Save reusable rule combinations on this browser only.';
}

export function RuleSettingsPanel({
  settings,
  analysisState,
  savedPresets,
  draftRecoveryEnabled,
  onToggleRule,
  onThresholdChange,
  onAddPhrase,
  onRemovePhrase,
  onSavePreset,
  onApplyPreset,
  onRenamePreset,
  onDeletePreset,
  onToggleDraftRecovery,
}: RuleSettingsPanelProps) {
  const [phraseInput, setPhraseInput] = useState('');
  const [presetInput, setPresetInput] = useState('');
  const [presetError, setPresetError] = useState<'blank' | 'duplicate' | null>(null);
  const [renamingPresetId, setRenamingPresetId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [renameError, setRenameError] = useState<'blank' | 'duplicate' | null>(null);
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

  function handlePresetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = onSavePreset(presetInput);
    if (!result.ok) {
      setPresetError(result.reason);
      return;
    }

    setPresetInput('');
    setPresetError(null);
  }

  function startRenamePreset(preset: SavedRulePreset) {
    setRenamingPresetId(preset.id);
    setRenameInput(preset.name);
    setRenameError(null);
  }

  function handleRenameSubmit(event: FormEvent<HTMLFormElement>, presetId: string) {
    event.preventDefault();
    const result = onRenamePreset(presetId, renameInput);

    if (!result.ok) {
      setRenameError(result.reason);
      return;
    }

    setRenamingPresetId(null);
    setRenameInput('');
    setRenameError(null);
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

      <div className="preset-panel">
        <div>
          <p className="snapshot-label">Rule preset</p>
          <p className="rule-toggle-helper">Save reusable settings on this same browser and apply them later without rebuilding every toggle.</p>
        </div>

        <form className="preset-form" onSubmit={handlePresetSubmit}>
          <input
            type="text"
            value={presetInput}
            onChange={(event) => {
              setPresetInput(event.target.value);
              if (presetError) {
                setPresetError(null);
              }
            }}
            placeholder="Name this preset"
            aria-label="Preset name"
          />
          <button type="submit" className="button-primary">
            Save preset
          </button>
        </form>

        <p className="rule-settings-copy">{formatPresetError(presetError)}</p>

        {savedPresets.length === 0 ? (
          <p className="rule-settings-copy">No presets saved on this browser yet.</p>
        ) : (
          <ul className="preset-list" aria-label="saved presets">
            {savedPresets.map((preset) => (
              <li key={preset.id} className="preset-item">
                {renamingPresetId === preset.id ? (
                  <form className="preset-rename-form" onSubmit={(event) => handleRenameSubmit(event, preset.id)}>
                    <input
                      type="text"
                      value={renameInput}
                      onChange={(event) => {
                        setRenameInput(event.target.value);
                        if (renameError) {
                          setRenameError(null);
                        }
                      }}
                      aria-label={`Rename preset ${preset.name}`}
                    />
                    <button type="submit" className="button-primary button-inline">
                      Save name
                    </button>
                    <button type="button" className="button-secondary button-inline" onClick={() => setRenamingPresetId(null)}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div>
                      <strong>{preset.name}</strong>
                      <p className="rule-toggle-helper">Updated {new Date(preset.updatedAt).toLocaleString()}</p>
                    </div>
                    <div className="preset-actions">
                      <button type="button" className="button-secondary button-inline" onClick={() => onApplyPreset(preset.id)}>
                        Apply preset
                      </button>
                      <button type="button" className="button-secondary button-inline" onClick={() => startRenamePreset(preset)}>
                        Rename preset
                      </button>
                      <button type="button" className="button-secondary button-inline" onClick={() => onDeletePreset(preset.id)}>
                        Delete preset
                      </button>
                    </div>
                  </>
                )}
                {renamingPresetId === preset.id && renameError ? <p className="rule-settings-copy">{formatPresetError(renameError)}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>

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
          <p className="rule-toggle-helper">This list is saved locally on the same browser.</p>
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

      <label className="rule-toggle-card recovery-toggle">
        <span>
          <strong>Enable draft recovery</strong>
          <span className="rule-toggle-helper">Remember the latest draft on this browser only, then ask before restoring it later.</span>
        </span>
        <input
          type="checkbox"
          checked={draftRecoveryEnabled}
          onChange={(event) => onToggleDraftRecovery(event.target.checked)}
          aria-label="Enable draft recovery"
        />
      </label>
    </section>
  );
}
