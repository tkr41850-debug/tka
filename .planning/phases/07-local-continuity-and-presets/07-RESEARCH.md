# Phase 7: Local Continuity and Presets - Research

**Researched:** 2026-03-10
**Domain:** Same-browser persistence for rule settings, dismissals, tutorial continuity, local presets, and explicit draft recovery in a browser-local writing assistant
**Confidence:** HIGH

## Summary

Phase 7 should extend the current app-owned state model instead of introducing a new storage abstraction or any remote dependency. `App.tsx` already owns the draft, analysis settings, dismissed warning keys, tutorial state, and worker refresh lifecycle. The safest persistence path is a versioned browser-local storage layer that saves only serializable app state and hydrates it defensively on startup. Corrupt or outdated data should fall back to current defaults instead of blocking the app.

The roadmap language makes recovery optional, and the current state file explicitly warns that draft restore must stay privacy-sensitive. That means settings, dismissals, presets, and tutorial completion can restore automatically on the same browser, but draft recovery should remain behind an explicit user-controlled preference plus a visible restore choice when saved draft content differs from the shipped starter draft. Users should understand when a draft was saved, what will be restored, and how to discard it.

Presets fit best inside the existing `RuleSettingsPanel.tsx` surface because users already tune rules there. A preset should capture the same normalized `AnalysisSettings` contract the analyzer already uses. Saving, applying, renaming, and deleting presets should operate entirely on browser-local JSON data and immediately refresh analysis through the existing scheduler path.

**Primary recommendation:** Add one versioned local persistence module with safe parse/normalize guards, hydrate the app shell from it on first render, keep presets as saved `AnalysisSettings` snapshots, and make draft restore opt-in with explicit restore-versus-discard UI.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RULE-04 | User can save and load local rule presets on the same device. | Store named presets as normalized `AnalysisSettings` snapshots and surface save/apply/delete controls in the existing settings panel. |
| SAVE-01 | User can keep rule settings, dismissals, and presets between visits on the same browser without creating an account. | Persist versioned app state in `localStorage`, validate on load, and hydrate only serializable browser-local data. |
| SAVE-02 | User can restore the last local draft or session on the same browser when local recovery is enabled. | Keep recovery behind an explicit toggle and show a visible restore/discard decision when a saved draft exists. |
</phase_requirements>

## Standard Stack

### Core
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| Existing React app state | React 19.x | Continue owning hydrated continuity state in `App.tsx` | Matches the current shell and avoids adding a state library late in the roadmap. |
| Browser `localStorage` | built-in | Same-browser persistence for settings, dismissals, presets, tutorial completion, and optional draft recovery | Meets the local-only promise with no backend or account model. |
| Existing `AnalysisSettings` contract | repo-local | Canonical preset and saved-settings payload | Already normalized, serializable, and used across UI plus worker boundaries. |
| Vitest + React Testing Library | 4.x / 16.x | Verify hydration, persistence, presets, and explicit draft recovery behavior | Current repo already uses fast app-level integration coverage effectively. |

### Supporting
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| Versioned JSON envelopes | repo-local | Detect schema drift and recover safely from stale data | Use for all browser-saved continuity state. |
| Existing dismissal keys | repo-local | Restore hidden warnings only when matching findings still exist | Reuse the current finding-identity approach instead of inventing rule-level persistence. |
| Existing live announcements | repo-local | Explain restore, preset, and recovery events accessibly | Keep trust messaging consistent with Phase 6. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `localStorage` with schema validation | IndexedDB | More complexity than needed for one draft plus small preset payloads. |
| Automatic draft restore on load | Explicit restore/discard prompt | Automatic restore is faster, but it conflicts with the privacy-sensitive recovery concern already logged in project state. |
| Separate preset management screen | Extend `RuleSettingsPanel.tsx` | A new screen adds navigation and scope overhead for a settings-adjacent feature. |
| Persisting entire live analysis results | Persist only source state and rerun analysis | Saved analysis snapshots can go stale and duplicate deterministic worker output. |

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── App.tsx
├── App.test.tsx
├── features/analysis/types.ts
├── features/workspace/components/
│   ├── RuleSettingsPanel.tsx
│   ├── WorkspaceEditor.tsx
│   ├── WorkspaceSnapshot.tsx
│   └── ReviewDetailPanel.tsx
└── features/workspace/lib/
    ├── browserPersistence.ts
    ├── browserPersistence.test.ts
    ├── createDismissedFindingKey.ts
    └── createAnnouncementMessage.ts
```

### Pattern 1: Versioned persistence envelope
**What:** Wrap saved payloads in `{ version, savedAt, data }` and validate shape before use.
**When to use:** All Phase 7 browser storage.
**Why:** Prevent bad saved data from breaking startup and make future migrations possible.

### Pattern 2: Hydrate source state, not derived analysis
**What:** Restore draft, settings, dismissal keys, preset metadata, and tutorial/recovery preferences, then let the worker-backed analysis pipeline compute fresh findings.
**When to use:** App startup and preset application.
**Why:** Keeps persistence small and aligned with the existing deterministic analyzer.

### Pattern 3: Explicit draft recovery gate
**What:** Save draft continuity only when recovery is enabled, and show a restore/discard choice if a recoverable draft exists.
**When to use:** SAVE-02 behavior.
**Why:** Matches the privacy-sensitive recovery policy already called out in `.planning/STATE.md`.

### Pattern 4: Presets as named settings snapshots
**What:** Save normalized `AnalysisSettings` plus lightweight metadata like `id`, `name`, and `updatedAt`.
**When to use:** RULE-04 flows.
**Why:** Reuses the current analyzer contract and avoids extra transform logic.

### Anti-Patterns to Avoid
- Do not add cloud sync, export/import, or accounts.
- Do not persist live `Set` instances or non-JSON values directly; serialize first.
- Do not restore stale dismissals blindly if the current findings no longer contain matching keys.
- Do not auto-restore draft text without a clear user-controlled recovery preference.
- Do not persist the current analyzer output when it can be recomputed locally.

## Implementation Guidance

### Persistence scope
- Persist normalized analysis settings, saved presets, tutorial completion/visibility preference, dismissal keys, and recovery preference.
- Keep dismissals attached to same-browser continuity, but prune them against current findings after analysis refresh just as the current in-memory flow already does.
- Save timestamps with draft and presets so the UI can explain what is being restored.

### Presets
- Add a small preset manager near the current rule controls rather than creating a separate workflow.
- Support save current settings as new preset, apply preset, rename preset, and delete preset.
- Keep preset names human-readable and reject blank or duplicate names case-insensitively.

### Draft recovery
- Add a clear recovery toggle that explains the local-only tradeoff.
- When enabled, save the current draft between visits.
- On load, if a saved draft exists and differs materially from the starter draft, show restore and discard actions before replacing the current workspace.

## Common Pitfalls

### Pitfall 1: Hydration flashes the wrong state
**What goes wrong:** The app renders defaults, then swaps to saved settings or draft in a confusing jump.
**How to avoid:** Load saved browser state during initial state creation, not in a delayed effect when practical.

### Pitfall 2: Corrupt storage breaks startup
**What goes wrong:** A malformed JSON payload throws and the app never finishes loading.
**How to avoid:** Parse inside a safe helper, validate shape, and fall back to defaults on failure.

### Pitfall 3: Persisted dismissals hide unrelated warnings forever
**What goes wrong:** Old dismissal keys keep suppressing findings after the draft changes.
**How to avoid:** Continue pruning dismissal keys against current findings and clear them when recovery or reset actions discard the matching state.

### Pitfall 4: Recovery feels invasive
**What goes wrong:** Users reopen the app and see old text without choosing to restore it.
**How to avoid:** Keep recovery opt-in and gate actual restoration behind a visible prompt with discard support.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + React Testing Library |
| Config file | `vite.config.ts` |
| Quick run command | `npm run test -- --run src/App.test.tsx src/features/workspace/lib/browserPersistence.test.ts` |
| Full suite command | `npm run test -- --run && npm run build` |
| Estimated runtime | ~15 seconds |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RULE-04 | User can save, apply, rename, and delete local rule presets | integration + unit | `npm run test -- --run src/App.test.tsx src/features/workspace/lib/browserPersistence.test.ts` | ❌ new storage test file |
| SAVE-01 | Same-browser visits restore settings, dismissals, presets, and tutorial continuity | integration | `npm run test -- --run src/App.test.tsx` | ✅ yes |
| SAVE-02 | Draft recovery stays opt-in and restore is explicit | integration | `npm run test -- --run src/App.test.tsx` | ✅ yes |

### Nyquist Sampling Rate
- **Minimum sample interval:** After each persistence or UI task, run its targeted `npm run test -- --run ...` command.
- **Full suite trigger:** Before closing the final plan in the phase.
- **Phase-complete gate:** `npm run test -- --run && npm run build`
- **Estimated feedback latency per task:** ~15 seconds

### Wave 0 Gaps (must be created before implementation)
- Add a dedicated persistence unit test file for schema validation and browser storage helpers.

## Sources

### Primary (HIGH confidence)
- Current codebase: `src/App.tsx`, `src/App.test.tsx`, `src/features/analysis/types.ts`, `src/features/workspace/components/RuleSettingsPanel.tsx`, `src/features/workspace/components/WorkspaceSnapshot.tsx`, `src/features/workspace/components/ReviewDetailPanel.tsx`
- Existing planning docs: `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`

### Secondary (MEDIUM confidence)
- Browser `localStorage` persistence patterns as standard web platform behavior

## Metadata

**Confidence breakdown:**
- Versioned browser-local storage for saved continuity state: HIGH
- Presets built from normalized `AnalysisSettings`: HIGH
- Explicit draft recovery prompt and opt-in model: HIGH

**Research date:** 2026-03-10
**Valid until:** 2026-04-09
