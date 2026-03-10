# Phase 6: Trustworthy First-Run Access - Research

**Researched:** 2026-03-10
**Domain:** First-run onboarding, keyboard-accessible review flows, assistive announcements, and session-only warning dismissals for a browser-local writing assistant
**Confidence:** HIGH

## Summary

Phase 6 should deepen trust without breaking the current local-first boundary or pulling persistence forward from Phase 7. The current app already has a clear editor, review list, rule settings, and detail panel, so the shortest path is a lightweight guided overlay that explains those three surfaces in place, plus session-only affordances that make the review experience feel controllable instead of noisy. Tutorial completion and per-warning dismissals should stay in memory for now; saving them between visits belongs to Phase 7.

The accessibility work should focus on three concrete upgrades instead of a vague "polish" pass: a properly labeled modal tutorial with managed focus, a dedicated live status region for important analysis and dismissal updates, and explicit severity/tone text that does not rely on color alone. The app already uses native buttons, inputs, and a textarea, so most keyboard access exists today. Phase 6 should preserve those native controls, tighten focus routing between review surfaces, and add screen-reader-friendly status updates when the user selects, dismisses, restores, or reapplies findings.

Per-warning dismissal should be implemented as suppression of individual findings in the current working draft, not as rule disablement and not as persistence. The safest fit is a session-owned dismissal set keyed by stable finding identity from the existing analysis output. That set should be filtered against the latest findings only, automatically dropping stale entries when the draft or rule settings change enough that the dismissed finding no longer exists.

**Primary recommendation:** Build Phase 6 around one app-owned trust layer: session tutorial state, session dismissed-finding state, a reusable announcement region, and focused UI updates that make tutorial, review, settings, and suggestion actions accessible without introducing browser storage yet.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REVW-04 | User can dismiss an individual warning in the current text without disabling the whole rule. | Keep a session-only dismissed-finding set in `App.tsx`, filter visible findings against it, and expose dismiss plus restore affordances in the review surfaces. |
| A11Y-01 | User can complete or skip a brief first-run tutorial that introduces highlights, the issue list, and rule settings in under one minute. | Use a short modal quick tour with 3-4 steps, clear skip/finish actions, managed focus, and a persistent-in-session reopen control. |
| A11Y-02 | User can review warnings, settings, and suggestions with keyboard access, assistive announcements, and non-color-only severity cues. | Preserve native button/input controls, add a polite live region for dynamic updates, and pair color with visible severity/tone labels or icons. |
</phase_requirements>

## Standard Stack

### Core
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| Existing React app state | React 19.x | Own tutorial, dismissal, and announcement state in one place | Matches the current single-shell architecture and avoids introducing a state library for one phase. |
| Existing local analysis pipeline | repo-local | Keep finding identity and review refresh behavior consistent while dismissals are filtered | Reuses the current worker-backed flow instead of inventing a second review path. |
| Native dialog semantics plus focus management | browser-native + ARIA | Make the first-run tutorial operable by keyboard and screen readers | Best fit for a short guided overlay with explicit labels and focus return. |
| Live-region announcements | ARIA | Announce analysis freshness, finding selection, dismissal, and restore outcomes | Fits the app's existing dynamic review updates without requiring a full custom widget model. |

### Supporting
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| Existing `DraftFinding` ids and location metadata | repo-local | Identify dismissible warnings and describe them accessibly | Use immediately so dismissal logic stays aligned with the same finding contract the UI already renders. |
| Vitest + React Testing Library | 4.x / 16.x | Verify focus, tutorial flow, dismissals, and announcement-visible UI behavior | Existing fast test stack already covers app-level interactions well. |
| CSS tokens and existing panel layout | repo-local | Add non-color severity cues and tutorial styling without changing the product's visual language | Use for targeted trust cues instead of a full redesign. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Session-only tutorial and dismissals | `localStorage` now | Conflicts with the roadmap split; saved onboarding/dismissals belong to Phase 7. |
| Modal quick tour over the current UI | Full product-tour library | Adds dependency weight and abstraction for a short 3-surface walkthrough the repo can implement directly. |
| Finding-id-based dismissals | Rule-level muting | Violates REVW-04 because it hides all findings from that rule, not just one warning. |
| Polite status region | `alert` everywhere | Too disruptive for routine refresh and review events; live updates should usually wait until the user is idle. |

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── App.tsx
├── App.test.tsx
├── features/workspace/
│   ├── components/
│   │   ├── FirstRunTutorial.tsx
│   │   ├── ReviewDetailPanel.tsx
│   │   ├── RuleSettingsPanel.tsx
│   │   ├── WorkspaceEditor.tsx
│   │   └── WorkspaceSnapshot.tsx
│   └── lib/
│       ├── createDismissedFindingKey.ts
│       └── createAnnouncementMessage.ts
└── styles.css
```

### Pattern 1: Session-owned trust state
**What:** Keep tutorial state, dismissed finding keys, and the latest assistive announcement in app state.
**When to use:** For all Phase 6 interactions.
**Why:** Trust features need to coordinate across the editor, finding list, detail panel, and settings without persistence yet.

### Pattern 2: Modal tutorial with explicit focus return
**What:** Open a small guided overlay on first load, move focus into it, and return focus to the launcher or previous control when it closes.
**When to use:** First-run tutorial and any later manual reopen.
**Why:** MDN dialog guidance emphasizes labeling and focus containment as essential for accessible dialogs.

### Pattern 3: Polite live region for dynamic review events
**What:** Keep one empty `role="status"` / `aria-live="polite"` region in the app shell and update it only when meaningful state changes occur.
**When to use:** Analysis status, active finding selection, dismissal success, and restore actions.
**Why:** MDN live-region guidance favors polite announcements for important but non-urgent updates.

### Pattern 4: Dismissals as filtered visibility, not analysis mutation
**What:** Preserve the analyzer result, then filter rendered findings against session dismissal keys.
**When to use:** REVW-04 behavior in the current session.
**Why:** Keeps the worker and analyzer deterministic while letting the app suppress one warning without disabling its rule.

### Anti-Patterns to Avoid
- Do not add `localStorage` or saved tutorial completion in this phase.
- Do not make the tutorial a hover-only or pointer-only walkthrough.
- Do not rely on border color alone to communicate severity or heuristic confidence.
- Do not dismiss warnings by matched text alone if multiple findings can share the same phrase.
- Do not use assertive announcements for routine queued/running state changes.

## Implementation Guidance

### Tutorial
- Keep the quick tour to 3 core ideas: highlighted text spans, prioritized review list, and live rule settings.
- Make skip and finish equally easy.
- Include a visible reopen action after the first close so users can revisit the tour during the same session.
- Keep the copy short enough to scan in under a minute.

### Accessibility
- Add a labeled dialog with `aria-labelledby`, `aria-describedby`, and focus movement into the first actionable control.
- Restore focus when the dialog closes.
- Add a polite live region that starts empty and only updates after mount.
- Ensure active findings expose more than color: visible severity text, heuristic/direct wording, and active state copy.

### Dismissals
- Use a stable dismissal key derived from finding id or another deterministic identity already present in the analysis result.
- Filter both the review list and detail-panel selection against dismissed findings.
- Provide at least one restore affordance so dismissal feels reversible inside the session.
- Clear stale dismissal keys automatically when the latest analysis no longer contains them.

## Common Pitfalls

### Pitfall 1: Tutorial focus leaks behind the overlay
**What goes wrong:** Keyboard users tab into the page behind the tutorial or lose focus on close.
**How to avoid:** Keep focus inside the dialog while it is open and restore it to the launcher or previously focused control on close.

### Pitfall 2: Live region never announces updates
**What goes wrong:** The app changes visible copy, but assistive tech says nothing.
**How to avoid:** Render the live region before updates happen, start it empty, then change its text only after interaction or async state changes.

### Pitfall 3: Dismissals hide the wrong warning
**What goes wrong:** Dismissing one warning removes a different warning from the same rule or phrase.
**How to avoid:** Key dismissals by stable finding identity, not by rule id alone.

### Pitfall 4: Severity still depends on color
**What goes wrong:** The UI technically changes colors, but low-vision or assistive-tech users still lack explicit risk cues.
**How to avoid:** Pair color with visible severity text, confidence copy, and consistent iconography or labels.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + React Testing Library |
| Config file | `vite.config.ts` |
| Quick run command | `npm run test -- --run src/App.test.tsx` |
| Full suite command | `npm run test -- --run && npm run build` |
| Estimated runtime | ~15 seconds |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REVW-04 | User can dismiss one warning, keep the rule enabled, and restore the warning in-session | integration | `npm run test -- --run src/App.test.tsx` | ✅ yes |
| A11Y-01 | User can complete or skip the tutorial and reopen it manually | integration | `npm run test -- --run src/App.test.tsx` | ✅ yes |
| A11Y-02 | Review, settings, and suggestions expose keyboard-safe controls, live announcements, and explicit severity cues | integration + build | `npm run test -- --run src/App.test.tsx && npm run build` | ✅ yes |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task -> run the task's targeted `npm run test -- --run ...` command.
- **Full suite trigger:** Before closing the final task of each plan wave.
- **Phase-complete gate:** `npm run test -- --run && npm run build`
- **Estimated feedback latency per task:** ~15 seconds

### Wave 0 Gaps (must be created before implementation)
- None - existing app-level integration coverage can expand in place for this phase.

## Sources

### Primary (HIGH confidence)
- Current codebase: `src/App.tsx`, `src/App.test.tsx`, `src/features/workspace/components/WorkspaceEditor.tsx`, `src/features/workspace/components/WorkspaceSnapshot.tsx`, `src/features/workspace/components/RuleSettingsPanel.tsx`, `src/features/workspace/components/ReviewDetailPanel.tsx`
- MDN ARIA dialog role: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/dialog_role
- MDN ARIA live regions: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions
- MDN color contrast guidance: https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Color_contrast

### Secondary (MEDIUM confidence)
- Existing roadmap and requirements files in `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, and `.planning/STATE.md`

## Metadata

**Confidence breakdown:**
- Modal tutorial + focus management: HIGH
- Live-region announcements for review updates: HIGH
- Session-only per-warning dismissals on top of current finding ids: HIGH
- Non-color severity cues and keyboard review flow refinements: HIGH

**Research date:** 2026-03-10
**Valid until:** 2026-04-09
