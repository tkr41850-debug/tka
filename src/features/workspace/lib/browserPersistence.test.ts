import { DEFAULT_ANALYSIS_SETTINGS } from '../../analysis/lib/defaultAnalysisSettings';
import {
  WORKSPACE_PERSISTENCE_KEY,
  clearWorkspacePersistence,
  createDefaultWorkspacePersistence,
  loadWorkspacePersistence,
  saveWorkspacePersistence,
} from './browserPersistence';

describe('browser persistence', () => {
  beforeEach(() => {
    clearWorkspacePersistence(window.localStorage);
  });

  it('saves and loads normalized continuity state', () => {
    saveWorkspacePersistence(
      {
        ...createDefaultWorkspacePersistence(),
        analysisSettings: {
          ...DEFAULT_ANALYSIS_SETTINGS,
          thresholds: {
            sentenceWordLimit: 999,
            paragraphSentenceLimit: 0,
          },
          customBannedPhrases: [' blocker ', 'Blocker', 'release freeze'],
        },
        presets: [
          {
            id: 'preset-1',
            name: ' Team review ',
            updatedAt: '2026-03-10T10:00:00.000Z',
            settings: {
              ...DEFAULT_ANALYSIS_SETTINGS,
              customBannedPhrases: [' note ', 'Note'],
            },
          },
        ],
      },
      window.localStorage,
    );

    const restored = loadWorkspacePersistence(window.localStorage);

    expect(restored.analysisSettings.thresholds.sentenceWordLimit).toBe(80);
    expect(restored.analysisSettings.thresholds.paragraphSentenceLimit).toBe(1);
    expect(restored.analysisSettings.customBannedPhrases).toEqual(['blocker', 'release freeze']);
    expect(restored.presets[0]?.name).toBe('Team review');
    expect(restored.presets[0]?.settings.customBannedPhrases).toEqual(['note']);
  });

  it('falls back safely when storage contains malformed json', () => {
    window.localStorage.setItem(WORKSPACE_PERSISTENCE_KEY, '{bad json');

    expect(loadWorkspacePersistence(window.localStorage)).toEqual(createDefaultWorkspacePersistence());
  });

  it('falls back safely when storage contains an unknown version', () => {
    window.localStorage.setItem(
      WORKSPACE_PERSISTENCE_KEY,
      JSON.stringify({
        version: 999,
        savedAt: '2026-03-10T10:00:00.000Z',
        data: {
          analysisSettings: DEFAULT_ANALYSIS_SETTINGS,
        },
      }),
    );

    expect(loadWorkspacePersistence(window.localStorage)).toEqual(createDefaultWorkspacePersistence());
  });

  it('drops invalid presets and recovery drafts when recovery is disabled', () => {
    window.localStorage.setItem(
      WORKSPACE_PERSISTENCE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: '2026-03-10T10:00:00.000Z',
        data: {
          analysisSettings: DEFAULT_ANALYSIS_SETTINGS,
          dismissedFindingKeys: ['keep-me'],
          tutorial: { completed: true, isOpen: false },
          draftRecoveryEnabled: false,
          savedDraft: { content: 'Should not load', savedAt: '2026-03-10T10:00:00.000Z' },
          presets: [{ id: 'bad', name: '   ', updatedAt: '2026-03-10T10:00:00.000Z', settings: DEFAULT_ANALYSIS_SETTINGS }],
        },
      }),
    );

    const restored = loadWorkspacePersistence(window.localStorage);

    expect(restored.dismissedFindingKeys).toEqual(['keep-me']);
    expect(restored.savedDraft).toBeNull();
    expect(restored.presets).toEqual([]);
  });
});
