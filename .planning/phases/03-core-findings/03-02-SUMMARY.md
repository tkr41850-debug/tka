---
phase: 03-core-findings
plan: 02
subsystem: analysis
tags: [analysis, heuristics, passive-voice, tense, vitest]
requires:
  - phase: 03-core-findings
    provides: Parse-once deterministic draft analysis and finding contracts
provides:
  - Conservative passive-voice and tense-drift heuristic detection
  - Confidence-aware findings that distinguish deterministic and likely warnings
  - Aggregate ranking that merges heuristic warnings with deterministic clarity issues
affects: [core-findings, contextual-review, guidance]
tech-stack:
  added: []
  patterns: [confidence-aware heuristics, conservative passive matching, merged deterministic and heuristic ranking]
key-files:
  created: [src/features/analysis/lib/findings/detectVoiceAndTense.ts, src/features/analysis/lib/findings/detectVoiceAndTense.test.ts]
  modified: [src/features/analysis/types.ts, src/features/analysis/lib/analyzeDraft.ts, src/features/analysis/lib/analyzeDraft.test.ts]
key-decisions:
  - Label passive voice and tense drift as likely heuristic findings instead of overstating certainty.
  - Keep heuristic rule priority below deterministic clarity checks when severity is otherwise equal.
patterns-established:
  - Heuristic detectors reuse parsed sentence spans and return the same finding contract as deterministic rules.
  - Passive-voice coverage protects against at least one common adjectival false positive before UI exposure.
requirements-completed: [CLAR-03, CLAR-04]
duration: 10 min
completed: 2026-03-10
---

# Phase 3 Plan 02: Core Findings Summary

**Conservative passive-voice and tense-drift heuristics merged into the shared local rule engine**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-10T07:12:00Z
- **Completed:** 2026-03-10T07:22:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Added one heuristic detector for likely passive voice and likely tense drift on top of the shared parsed draft model.
- Extended finding metadata so the worker can distinguish deterministic matches from lower-confidence heuristic warnings.
- Added targeted fixtures for positive matches, present-tense quiet paths, and a passive false-positive guard.

## task Commits

No task commits were created in this execution session.

## Files Created/Modified
- `src/features/analysis/lib/findings/detectVoiceAndTense.ts` - implements conservative passive-voice and tense-drift heuristics.
- `src/features/analysis/lib/findings/detectVoiceAndTense.test.ts` - covers likely matches and an adjectival false-positive guard.
- `src/features/analysis/lib/analyzeDraft.ts` - merges deterministic and heuristic findings into one ranked list.
- `src/features/analysis/lib/analyzeDraft.test.ts` - verifies stable ordering across mixed rule types.

## Decisions Made
- Treated tense drift as an obvious-marker heuristic using words like `will`, `was`, and `had` so the first pass stays conservative.
- Kept heuristic findings at low severity with explicit likely wording to preserve user trust in the review list.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The worker-facing analyzer now returns both deterministic and heuristic findings through one stable contract.
- Phase 3 plan 03 can render the ranked list directly without adding sorting logic in React.

---
*Phase: 03-core-findings*
*Completed: 2026-03-10*
