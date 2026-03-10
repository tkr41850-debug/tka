# Phase 4: Contextual Review and Guidance - Research

**Researched:** 2026-03-10
**Domain:** Inline review affordances, issue navigation, explanation copy, and safe local rewrite application for a browser-only textarea workflow
**Confidence:** MEDIUM-HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REVW-01 | User can see inline highlights or underlines on the exact text spans that have detected issues. | Keep the existing textarea editor, render a mirrored highlight layer from stored offsets, and sync scroll plus selection so highlights stay aligned without replacing the input model. |
| REVW-03 | User can move from an issue-list entry to the matching text and back. | Use stable finding ids plus textarea focus and `setSelectionRange()` to jump to an issue span, while preserving the active finding in React state so the list and editor stay in sync. |
| GUID-01 | User can see a short explanation of why each warning triggered. | Expand each finding to carry concise explanation text and show it in a dedicated review detail area rather than burying it inside the list only. |
| GUID-02 | User can see targeted rewrite suggestions or examples for supported rules. | Add optional guidance payloads per finding with replacement text or example copy, starting with deterministic wording rules and the new jargon detector. |
| GUID-03 | User can apply a safe suggested rewrite and undo that change. | Apply replacements through textarea range APIs or equivalent string-slice updates, record one-step local undo metadata, and re-run analysis immediately after each accepted change. |
| CLAR-05 | User can detect jargon or overly complex wording and see simpler alternatives when available. | Start with a curated local phrase pack that maps complex terms to plainer alternatives and emits suggestion metadata beside the finding explanation. |
</phase_requirements>

## Summary

Phase 4 should stay inside the current single-textarea product boundary instead of switching to a rich-text editor. Native `<textarea>` elements do not support inline markup for partial underlines, so the best fit for this repo is a mirrored presentation layer: keep the textarea as the real input, render a synchronized highlight surface behind or beside it from finding offsets, and use programmatic focus plus selection to move the user to the exact issue span. This preserves Phase 1's simple editing model and Phase 2's responsive worker loop while still satisfying inline-review requirements.

The guidance model should move into analysis data, not stay UI-only. Each finding already includes severity, confidence, location, explanation, and matched text. Phase 4 should extend that contract with a stable id, an `isNavigable`/`isActive`-friendly shape, and optional suggestion entries such as a direct replacement or a short rewrite example. That keeps the worker as the single source of review truth and lets the UI render explanations, navigation, and rewrite actions without inventing rule-specific logic in React.

For `CLAR-05`, the safest first release is a curated jargon-and-complexity glossary rather than a broad readability model. The detector can look for specific words and short phrases such as `utilize`, `leverage`, `facilitate`, `robust`, `synergy`, or `at this point in time`, then return simpler alternatives like `use`, `help`, `strong`, or the shorter direct phrasing. This matches the app's trust-first posture: users should see why a phrase was flagged and what plainer wording is suggested, not a vague claim that the prose feels complex.

Safe rewrite application should be narrow and reversible. The app should only offer one-click apply actions when a finding provides an exact replacement span and replacement text. On apply, update the draft, keep the edited span selected or visible, store a one-step undo snapshot containing the previous draft plus selection information, and immediately queue a fresh analysis so stale suggestions disappear. This avoids introducing an always-on edit history system before Phase 7 handles broader persistence and session continuity.

**Primary recommendation:** Build Phase 4 around four pieces: richer finding guidance metadata in analysis, a mirrored highlight-and-navigation controller for the existing textarea, a focused review-detail panel for explanation and suggestions, and a minimal safe-apply-plus-undo command path that only works for deterministic replacements.

## Standard Stack

### Core
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| Existing React app state | React 19.2.4 | Track active finding, review detail visibility, and one-step undo metadata | Matches the current SPA architecture and avoids introducing a state library for one workflow. |
| Existing local worker analysis pipeline | repo-local | Generate richer finding metadata and refresh after applied rewrites | Reuses the Phase 2 and Phase 3 architecture so guidance stays browser-local and deterministic. |
| Mirrored textarea highlight layer | repo-local | Show inline underlines and active-span emphasis while preserving native textarea editing | Fits the current one-textarea boundary better than swapping to a third-party editor. |
| Native textarea selection APIs | browser-native | Jump to issues and apply exact-range replacements | `setSelectionRange()` and `setRangeText()` are baseline-supported and well suited to safe local edits. |

### Supporting
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| Existing `DraftFinding` offsets | repo-local | Drive both highlight rendering and text navigation from one source | Use immediately so the UI does not invent a second location model. |
| Vitest | 4.0.18 | Unit-test suggestion generation and rewrite helpers | Use for deterministic jargon coverage and replacement edge cases. |
| React Testing Library | 16.3.2 | Verify list-to-text navigation, detail-panel copy, apply actions, and undo behavior | Use for user-visible flows across the current app shell. |
| `HTMLElement.focus()` options | browser-native | Return focus to the editor without losing context | Useful when moving between list actions and textarea navigation on desktop and mobile. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Mirrored highlight layer on the existing textarea | Rich-text editor such as Slate, ProseMirror, or CodeMirror | Stronger inline decoration support, but it breaks the current simple-input boundary and expands scope sharply. |
| Curated jargon glossary | Readability model, LLM, or large NLP dependency | Broader coverage, but weaker trust, more bundle cost, or a no-cloud boundary violation. |
| One-step safe apply + undo | Full edit-history feature | More powerful, but better owned by the later persistence/session phase instead of this focused review phase. |
| Worker-generated guidance payloads | UI-side rule-specific suggestion logic | Faster to prototype, but duplicates analysis knowledge and makes rule coverage harder to test. |

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── features/analysis/
│   ├── lib/
│   │   ├── analyzeDraft.ts
│   │   ├── findings/
│   │   │   ├── detectLengthAndWordiness.ts
│   │   │   ├── detectVoiceAndTense.ts
│   │   │   └── detectComplexWording.ts
│   │   └── suggestions/
│   │      └── buildFindingGuidance.ts
│   └── types.ts
├── features/workspace/
│   ├── components/
│   │   ├── WorkspaceEditor.tsx
│   │   ├── WorkspaceSnapshot.tsx
│   │   └── ReviewDetailPanel.tsx
│   ├── lib/
│   │   ├── createHighlightedDraftSegments.ts
│   │   ├── applySuggestedRewrite.ts
│   │   └── applySuggestedRewrite.test.ts
│   └── types.ts
└── App.tsx
```

### Pattern 1: One location model for list, highlight, and rewrite
**What:** Use the same finding offsets and ids for review-list rendering, active editor highlighting, selection jumps, and safe replacements.
**When to use:** Immediately, because Phase 4 adds multiple interactions on top of the same findings.
**Why:** Prevents drift where the list points to one span, the underline shows another, and the rewrite applies to a third.

### Pattern 2: Textarea-first review UX
**What:** Keep the textarea as the real editable control and build contextual review around it through overlays, active selection, and side-panel details.
**When to use:** For the whole phase, unless the product intentionally decides to abandon the Phase 1 editing boundary.
**Why:** Preserves native input behavior, mobile compatibility, and the app's current implementation simplicity.

### Pattern 3: Suggest only deterministic safe edits
**What:** Only show one-click `Apply` when the finding provides an exact replacement span and replacement text.
**When to use:** For jargon, filler phrases, and other rule-backed wording replacements.
**Why:** Keeps user trust high and avoids auto-editing on heuristic findings such as passive voice unless a clearly bounded rewrite is available.

### Pattern 4: Immediate reanalysis after accepted edits
**What:** Queue a fresh local analysis right after a suggestion is applied or undone.
**When to use:** Every time the draft changes from a review action.
**Why:** Prevents stale findings from lingering after the text has changed.

### Anti-Patterns to Avoid
- Do not replace the textarea with a full rich-text editor just to get underlines.
- Do not apply suggestions by searching the whole document for matching text; use exact offsets only.
- Do not offer auto-apply actions for heuristic warnings that lack a deterministic replacement.
- Do not make the review list the only way to understand a warning; the active item needs a compact detail surface.

## Implementation Guidance

### Editor and navigation
- Use stable finding ids and active-finding state in `App.tsx`.
- When the user chooses a finding, focus the textarea and call `setSelectionRange(start, end)` so the matching text is selected.
- Keep navigation bidirectional: clicking a finding activates the editor span, and caret movement inside the editor should be able to update the active finding when the cursor enters a flagged range.
- Mirror scroll position between the textarea and highlight layer so long drafts remain aligned.

### Highlight rendering
- Build a segment helper that turns the draft plus active findings into ordered text chunks.
- Underline all visible findings and give the active finding a stronger treatment.
- If findings overlap, prefer the highest-priority active span and collapse secondary styling rather than stacking unreadable decorations.

### Guidance payloads
- Add optional guidance data such as:
  - short why-it-fired explanation
  - suggested replacement text
  - optional example rewrite
  - whether the suggestion is safe to apply automatically
- Keep copy short and direct; the list should stay scannable while the detail panel carries the fuller explanation.

### Safe rewrite model
- Use exact start/end offsets plus replacement text.
- Store one-step undo metadata: previous draft, prior selection, and the finding id or span that triggered the action.
- After apply or undo, return focus to the textarea and queue a fresh worker refresh.

## Common Pitfalls

### Pitfall 1: Offset drift after edits
**What goes wrong:** A suggestion applies, but active highlights still reference the old draft and navigation lands on the wrong text.
**How to avoid:** Recompute findings from fresh analysis after every applied or undone edit, and clear any active finding ids that no longer exist.

### Pitfall 2: Overlay and textarea scroll mismatch
**What goes wrong:** Highlights look accurate at the top of the document but drift out of alignment in longer drafts.
**How to avoid:** Use the same font, spacing, padding, and scrollTop/scrollLeft synchronization between the textarea and mirrored layer.

### Pitfall 3: Too many `Apply` buttons for uncertain guidance
**What goes wrong:** Users lose trust because a heuristic warning appears to promise a definitive rewrite.
**How to avoid:** Reserve direct apply for deterministic replacements and use examples-only copy for more interpretive guidance.

### Pitfall 4: Navigation that steals too much context
**What goes wrong:** Choosing a finding jumps the user aggressively and they lose their place in long drafts.
**How to avoid:** Preserve active finding state, avoid unnecessary scrolling when already in view, and provide an easy way back to the review list.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + React Testing Library |
| Config file | `vite.config.ts` |
| Quick run command | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts src/features/workspace/lib/applySuggestedRewrite.test.ts src/App.test.tsx` |
| Full suite command | `npm run test -- --run && npm run build` |
| Estimated runtime | ~15 seconds |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REVW-01 | Inline highlight surface renders exact issue spans and active-state emphasis | component | `npm run test -- --run src/App.test.tsx` | ✅ `src/App.test.tsx` exists |
| REVW-03 | User can jump from list entry to matching text and maintain active review context | integration | `npm run test -- --run src/App.test.tsx` | ✅ `src/App.test.tsx` exists |
| GUID-01 | Warning detail surface shows short explanation copy for the active issue | integration | `npm run test -- --run src/App.test.tsx` | ✅ `src/App.test.tsx` exists |
| GUID-02 | Supported findings show rewrite suggestions or examples | unit + integration | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts src/App.test.tsx` | ✅ `src/features/analysis/lib/analyzeDraft.test.ts` exists |
| GUID-03 | Safe suggestion apply and one-step undo update the draft correctly | unit + integration | `npm run test -- --run src/features/workspace/lib/applySuggestedRewrite.test.ts src/App.test.tsx` | ❌ Wave 1 creates |
| CLAR-05 | Curated jargon or complex wording findings emit simpler alternatives | unit | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts` | ✅ `src/features/analysis/lib/analyzeDraft.test.ts` exists |

### Nyquist Sampling Rate
- **After every task commit:** Run that task's targeted `npm run test -- --run ...` command or `npm run build` for contract-only changes.
- **After every plan wave:** Run `npm run test -- --run && npm run build`.
- **Phase-complete gate:** The full suite plus build must pass before verification.
- **Estimated feedback latency per task:** ~15 seconds.

### Wave 0 Gaps (must be created before later implementation depends on them)
- [ ] `src/features/workspace/lib/applySuggestedRewrite.test.ts` - deterministic coverage for exact-range replace and one-step undo behavior

Existing test infrastructure already covers component and integration work, so no separate Wave 0 plan is required if Plan 01 creates the new rewrite-helper tests before later UI tasks depend on them.

## Sources

### Primary (HIGH confidence)
- `https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement/setSelectionRange` - confirms exact-range selection and focus behavior for issue navigation inside the existing textarea
- `https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement/setRangeText` - confirms exact-range replacement support suitable for safe local suggestion application
- `https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus` - confirms programmatic focus behavior and scroll implications when moving between the review list and editor

### Secondary (MEDIUM confidence)
- `https://developers.google.com/style/highlights` - supports concise, user-facing explanation copy and accessible wording principles for guidance text
- `https://developers.google.com/style/word-list` - supports the use of plainer alternatives and jargon reduction as a trustable first glossary for `CLAR-05`
- Existing repo code in `src/App.tsx`, `src/features/workspace/components/WorkspaceEditor.tsx`, and `src/features/workspace/components/WorkspaceSnapshot.tsx` - confirms the current textarea-first architecture and review-list surface that Phase 4 should extend

## Metadata

**Confidence breakdown:**
- Textarea-based issue navigation and exact-range replacement: HIGH
- Mirrored highlight layer on the current editor model: MEDIUM-HIGH
- Curated jargon detection with simpler alternatives: HIGH
- Safe rewrite apply plus undo behavior: MEDIUM-HIGH

**Research date:** 2026-03-10
**Valid until:** 2026-04-09
