import { DEFAULT_ANALYSIS_SETTINGS } from '../../analysis/lib/defaultAnalysisSettings';
import { normalizeAnalysisSettings } from '../../analysis/lib/normalizeAnalysisSettings';
import type {
  AnalysisSettings,
  SavedDraftRecovery,
  SavedRulePreset,
  WorkspacePersistence,
  WorkspacePersistenceEnvelope,
} from '../../analysis/types';

export const WORKSPACE_PERSISTENCE_KEY = 'technical-writing-assistant.workspace.v1';
export const WORKSPACE_PERSISTENCE_VERSION = 1;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function getStorage(storage?: StorageLike) {
  if (storage) {
    return storage;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function normalizeDismissedFindingKeys(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function normalizeTimestamp(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : new Date(0).toISOString();
}

function countWords(content: string) {
  const trimmed = content.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function normalizeSavedDraft(value: unknown): SavedDraftRecovery | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<SavedDraftRecovery>;

  if (typeof candidate.content !== 'string') {
    return null;
  }

  return {
    content: candidate.content,
    savedAt: normalizeTimestamp(candidate.savedAt),
    characters: candidate.content.length,
    words: countWords(candidate.content),
  };
}

function normalizePreset(value: unknown): SavedRulePreset | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<SavedRulePreset>;
  const name = typeof candidate.name === 'string' ? candidate.name.trim().replace(/\s+/g, ' ') : '';

  if (!name) {
    return null;
  }

  return {
    id: typeof candidate.id === 'string' && candidate.id.length > 0 ? candidate.id : crypto.randomUUID(),
    name,
    settings: normalizeAnalysisSettings(candidate.settings),
    updatedAt: normalizeTimestamp(candidate.updatedAt),
  };
}

function normalizePresets(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const presets: SavedRulePreset[] = [];

  for (const item of value) {
    const preset = normalizePreset(item);

    if (!preset) {
      continue;
    }

    const dedupeKey = preset.name.toLowerCase();
    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    presets.push(preset);
  }

  return presets;
}

export function createDefaultWorkspacePersistence(
  analysisSettings: AnalysisSettings = DEFAULT_ANALYSIS_SETTINGS,
): WorkspacePersistence {
  return {
    analysisSettings: normalizeAnalysisSettings(analysisSettings),
    dismissedFindingKeys: [],
    tutorial: {
      completed: false,
      isOpen: true,
    },
    draftRecoveryEnabled: false,
    savedDraft: null,
    presets: [],
  };
}

export function normalizeWorkspacePersistence(value: unknown): WorkspacePersistence {
  if (!value || typeof value !== 'object') {
    return createDefaultWorkspacePersistence();
  }

  const candidate = value as Partial<WorkspacePersistence>;
  const normalized = createDefaultWorkspacePersistence(candidate.analysisSettings);
  const tutorialCandidate = candidate.tutorial;
  const draftRecoveryEnabled = Boolean(candidate.draftRecoveryEnabled);

  normalized.dismissedFindingKeys = normalizeDismissedFindingKeys(candidate.dismissedFindingKeys);
  normalized.tutorial = {
    completed: Boolean(tutorialCandidate?.completed),
    isOpen: tutorialCandidate?.isOpen ?? !tutorialCandidate?.completed,
  };
  normalized.draftRecoveryEnabled = draftRecoveryEnabled;
  normalized.savedDraft = draftRecoveryEnabled ? normalizeSavedDraft(candidate.savedDraft) : null;
  normalized.presets = normalizePresets(candidate.presets);

  return normalized;
}

export function loadWorkspacePersistence(storage?: StorageLike): WorkspacePersistence {
  const target = getStorage(storage);

  if (!target) {
    return createDefaultWorkspacePersistence();
  }

  const raw = target.getItem(WORKSPACE_PERSISTENCE_KEY);

  if (!raw) {
    return createDefaultWorkspacePersistence();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WorkspacePersistenceEnvelope>;

    if (parsed.version !== WORKSPACE_PERSISTENCE_VERSION) {
      return createDefaultWorkspacePersistence();
    }

    return normalizeWorkspacePersistence(parsed.data);
  } catch {
    return createDefaultWorkspacePersistence();
  }
}

export function saveWorkspacePersistence(state: WorkspacePersistence, storage?: StorageLike) {
  const target = getStorage(storage);

  if (!target) {
    return;
  }

  const normalized = normalizeWorkspacePersistence(state);
  const envelope: WorkspacePersistenceEnvelope = {
    version: WORKSPACE_PERSISTENCE_VERSION,
    savedAt: new Date().toISOString(),
    data: normalized,
  };

  target.setItem(WORKSPACE_PERSISTENCE_KEY, JSON.stringify(envelope));
}

export function clearWorkspacePersistence(storage?: StorageLike) {
  const target = getStorage(storage);
  target?.removeItem(WORKSPACE_PERSISTENCE_KEY);
}
