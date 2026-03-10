# Phase 5: Rule Tuning and Custom Detection - Research

**Researched:** 2026-03-10
**Domain:** Browser-local rule configuration, worker-safe analysis settings, and React-controlled settings UI
**Confidence:** HIGH

## Summary

Phase 5 should stay inside the existing browser-local architecture instead of introducing new dependencies or persistence. The current app already has one authoritative draft in `App.tsx`, a worker-backed analysis loop, and deterministic finding contracts. The cleanest extension is to add one serializable `AnalysisSettings` object with defaults and normalization rules, pass that object through every analysis request, and let the analysis layer decide which rules run and what thresholds apply.

The worker boundary matters. MDN's structured clone guidance confirms worker messages should stay limited to clone-safe plain objects and primitives, so rule settings should remain JSON-like data only: booleans, numbers, strings, and arrays. Avoid `Set`, `Map`, class instances, or helper functions in worker payloads. React's controlled input guidance also reinforces that toggles, number inputs, and phrase fields should be driven from app state with synchronous `onChange` updates so the settings panel stays trustworthy while the analysis loop refreshes.

The biggest implementation risk is scope leakage into persistence. Phase 5 only needs live in-memory tuning for the current browser session. Local presets and saved settings belong to Phase 7. Plan tasks should therefore centralize defaults, normalization, and worker plumbing now, while explicitly deferring `localStorage`, import/export, and preset management.

**Primary recommendation:** Add one normalized `AnalysisSettings` contract in the analysis feature, thread it through the worker protocol, and expose it through a dedicated React settings panel without introducing persistence yet.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RULE-01 | User can enable or disable each available rule individually. | Use one `enabledRules` map inside `AnalysisSettings`, keep it in `App.tsx`, and have each detector return early when its rule is disabled. |
| RULE-02 | User can change numeric thresholds for supported rules such as sentence length and paragraph length. | Keep numeric thresholds in normalized analysis settings and feed them directly into the existing deterministic length detectors. |
| RULE-03 | User can define custom banned phrases that are checked against the current text. | Add a deterministic banned-phrase detector driven by normalized phrase arrays and whole-phrase, case-insensitive matching. |
| CLAR-07 | User can detect occurrences of custom banned phrases. | Emit standard deterministic findings with stable ids, labels, explanations, and exact match spans so the current review UI can render them without a special case. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | Controlled toggles, number inputs, and phrase fields | The app already uses app-level controlled state, and React's input guidance fits this settings workflow cleanly. |
| TypeScript | 5.9.x | Shared settings contracts across UI, app shell, and worker | The repo already depends on shared analysis contracts and worker-safe typing. |
| Vitest + Testing Library | 4.x / 16.x | Targeted unit and integration verification | Existing tests already cover analyzer behavior and UI-driven worker refresh flows quickly. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Browser Web Workers | built-in | Keep analysis off the typing path while settings change | Use the existing worker/client/scheduler seam instead of moving analysis into the render tree. |
| Plain objects + arrays | built-in | Structured-clone-safe settings transport | Use for worker messages and normalized rule settings. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| App-owned controlled settings state | Local form library | Adds indirection without solving a current problem; the settings surface is small and already fits existing React patterns. |
| In-memory settings only | `localStorage` persistence now | Conflicts with the roadmap split; persistence belongs to Phase 7. |
| Plain-object worker payloads | `Set`/`Map` collections in requests | Harder to reason about across structured clone boundaries and unnecessary for this rule pack size. |

**Installation:**
```bash
# No new packages required for Phase 5.
```

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── features/analysis/lib/              # normalized settings, detector composition, worker-safe analysis logic
├── features/analysis/lib/findings/     # rule-specific detectors, including custom banned phrases
├── features/analysis/workers/          # worker entry that receives draft + settings
└── features/workspace/components/      # settings panel and current review surfaces
```

### Pattern 1: One authoritative settings object
**What:** Store one `AnalysisSettings` object at the app shell, normalize it before analysis, and pass it through every queue/flush request.
**When to use:** Any setting that changes detector behavior or UI copy.
**Example:**
```typescript
type AnalysisSettings = {
  enabledRules: Record<string, boolean>;
  thresholds: {
    sentenceWordLimit: number;
    paragraphSentenceLimit: number;
  };
  customBannedPhrases: string[];
};
```

### Pattern 2: Detector gating inside analysis, not the UI
**What:** Let detectors read normalized settings and decide whether to emit findings.
**When to use:** Rule toggles, threshold changes, and custom banned phrase matching.
**Example:**
```typescript
if (!settings.enabledRules['long-sentence']) {
  return [];
}
```

### Pattern 3: Reuse existing finding contracts for custom phrases
**What:** Emit banned-phrase matches as standard deterministic findings with exact offsets and explanatory copy.
**When to use:** Any configurable rule that should still appear in the current prioritized review, highlight layer, and detail panel.
**Example:**
```typescript
{
  ruleId: 'custom-banned-phrase',
  ruleLabel: 'Custom banned phrase',
  confidence: 'deterministic',
}
```

### Anti-Patterns to Avoid
- **Duplicated defaults in UI and analysis:** Keep one source of truth for enabled rules and thresholds.
- **Worker-unfriendly settings objects:** Do not send functions, DOM nodes, class instances, or mutable collections through `postMessage`.
- **Premature persistence:** Do not add saved presets, restore logic, or browser storage in this phase.
- **UI-only filtering:** Do not hide findings after analysis; disabled rules should stop creating findings in the analysis layer.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rule transport to the worker | A second ad hoc message channel | The existing typed worker request/result flow | The scheduler already solves freshness and latest-result-wins behavior. |
| Phrase parsing | A new parser or token tree | The existing parsed draft spans plus regex/substring matching | Current rule complexity does not justify a new parsing subsystem. |
| Form state orchestration | Custom mini state machines per control | Controlled React inputs bound to app state | The settings surface is small and must stay transparent. |

**Key insight:** The repo already has the right seams; Phase 5 should extend them instead of creating parallel infrastructure.

## Common Pitfalls

### Pitfall 1: Controlled input drift
**What goes wrong:** Checkboxes or number inputs render stale values or become read-only.
**Why it happens:** React controlled inputs require synchronous `onChange` updates tied to the same state value being rendered.
**How to avoid:** Keep settings in app state, always pass `checked`/`value` plus an immediate `onChange`, and normalize numeric strings before analysis.
**Warning signs:** Console warnings about controlled/uncontrolled inputs or inputs snapping back after edits.

### Pitfall 2: Structured clone breakage
**What goes wrong:** Worker requests fail because settings include non-cloneable values.
**Why it happens:** Worker `postMessage` uses the structured clone algorithm, which excludes functions, DOM nodes, and some object metadata.
**How to avoid:** Keep settings as plain objects, arrays, numbers, booleans, and strings.
**Warning signs:** `DataCloneError` or worker analysis falling into the existing error state after a settings change.

### Pitfall 3: Noisy banned phrase matches
**What goes wrong:** Custom phrases match partial words, duplicate findings, or blank entries.
**Why it happens:** Raw input is not trimmed, deduped, or escaped before building a search pattern.
**How to avoid:** Normalize whitespace, trim entries, dedupe case-insensitively, and escape regex characters before matching.
**Warning signs:** Findings appear for empty phrases, punctuation-only phrases, or multiple identical entries.

### Pitfall 4: Stale active finding state after rule changes
**What goes wrong:** The UI keeps pointing at a finding that disappeared when settings changed.
**Why it happens:** Phase 4 preserves active finding context, but Phase 5 introduces more ways for results to disappear.
**How to avoid:** Reuse the existing active-finding cleanup logic after fresh analysis and add integration coverage for settings-driven removal.
**Warning signs:** Detail panel shows nothing useful or the editor selection points to an invalid range after a rule toggle.

## Code Examples

Verified patterns from current repo and official sources:

### Controlled checkbox + number input pattern
```typescript
function RuleToggle({ enabled, limit, onEnabledChange, onLimitChange }: Props) {
  return (
    <>
      <input type="checkbox" checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} />
      <input type="number" value={limit} onChange={(event) => onLimitChange(event.target.value)} />
    </>
  );
}
```

### Worker-safe request shape
```typescript
type AnalysisJobRequest = {
  requestId: number;
  draft: string;
  queuedAt: number;
  settings: AnalysisSettings;
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hard-coded detector thresholds and phrase packs | Normalized settings passed into analysis on every request | Phase 5 | Lets the UI tune rules without special-casing the findings renderer. |
| Static review list only | Configurable review that still uses the same finding contract | Phase 5 | Preserves Phase 3 and 4 rendering investments while widening control. |
| Settings saved nowhere | Settings remain in memory until Phase 7 adds persistence | Current roadmap | Keeps Phase 5 focused on live tuning, not storage policy. |

## Open Questions

1. **Should banned-phrase matching support substring matches inside larger words?**
   - What we know: The current rule pack uses phrase-oriented text matches.
   - What's unclear: Some users may want substring detection later.
   - Recommendation: Start with case-insensitive whole-phrase matching and revisit only if real examples require looser matching.

2. **Should numeric thresholds allow invalid intermediate UI states?**
   - What we know: Controlled number inputs often expose temporary empty strings while the user edits.
   - What's unclear: Whether to clamp on every keystroke or on blur.
   - Recommendation: Keep a small UI draft string if needed, but normalize before analysis so the worker always receives valid integers.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + React Testing Library |
| Config file | `vite.config.ts` |
| Quick run command | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts src/App.test.tsx` |
| Full suite command | `npm run test -- --run && npm run build` |
| Estimated runtime | ~15 seconds |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RULE-01 | Disabled rules stop emitting findings and the UI can toggle them live | integration | `npm run test -- --run src/App.test.tsx` | ✅ yes |
| RULE-02 | Sentence and paragraph limits can be changed and the findings update | unit + integration | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts src/App.test.tsx` | ✅ yes |
| RULE-03 | Users can add and remove custom banned phrases from the active session | integration | `npm run test -- --run src/App.test.tsx` | ✅ yes |
| CLAR-07 | Custom banned phrases produce deterministic findings with exact spans | unit | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts` | ✅ yes |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task -> run the task's targeted `npm run test -- --run ...` command.
- **Full suite trigger:** Before closing the final task of each plan wave.
- **Phase-complete gate:** `npm run test -- --run && npm run build`
- **Estimated feedback latency per task:** ~15 seconds

### Wave 0 Gaps (must be created before implementation)
- None - existing Vitest and React Testing Library coverage can be extended in-place for this phase.

## Sources

### Primary (HIGH confidence)
- Current codebase: `src/App.tsx`, `src/features/analysis/lib/analyzeDraft.ts`, `src/features/analysis/lib/createAnalysisWorkerClient.ts`, `src/features/analysis/workers/localAnalysis.worker.ts`
- React input reference - controlled text, checkbox, and number input behavior: https://react.dev/reference/react-dom/components/input
- MDN structured clone algorithm - worker-safe message constraints: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
- Vitest getting started - shared Vite config and focused `vitest run` usage: https://vitest.dev/guide/

### Secondary (MEDIUM confidence)
- None.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - uses the repo's existing React, worker, and Vitest setup with current official docs for input and test behavior.
- Architecture: HIGH - directly extends current code seams and worker-safe message rules.
- Pitfalls: HIGH - combines official guidance with repo-specific state and worker behavior already visible in code.

**Research date:** 2026-03-10
**Valid until:** 2026-04-09
