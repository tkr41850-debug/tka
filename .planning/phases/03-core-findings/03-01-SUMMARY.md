---
phase: 03-core-findings
plan: 01
subsystem: analysis
tags: [analysis, parsing, findings, vitest, worker]
requires:
  - phase: 02-responsive-analysis-loop
    provides: Worker-backed background analysis with stable freshness handling
provides:
  - Shared draft-analysis types for findings, severity, confidence, and stable locations
  - Parse-once sentence and paragraph helpers with deterministic span metadata
  - Deterministic length and filler-phrase detection with aggregate ordering coverage
affects: [core-findings, contextual-review, guidance]
tech-stack:
  added: []
  patterns: [parse-once draft analysis, deterministic finding ranking, span-aware local rule detection]
key-files:
  created: [src/features/analysis/lib/parseDraft.ts, src/features/analysis/lib/findings/detectLengthAndWordiness.ts, src/features/analysis/lib/analyzeDraft.ts, src/features/analysis/lib/analyzeDraft.test.ts]
  modified: [src/features/analysis/types.ts]
key-decisions:
  - Keep one serializable DraftAnalysis shape that carries both the existing snapshot metrics and all finding metadata.
  - Sort deterministic findings inside the analysis layer by severity, then rule priority, then earliest text offset.
patterns-established:
  - Draft parsing happens once before detectors run so sentence and paragraph boundaries stay consistent across rules.
  - Deterministic findings include exact offsets, matched text, and human-readable location labels that later UI work can reuse.
requirements-completed: [CLAR-01, CLAR-02, CLAR-06]
duration: 12 min
completed: 2026-03-10
---

# Phase 3 Plan 01: Core Findings Summary

**Parse-once local draft analysis with deterministic long-sentence, long-paragraph, and filler-phrase findings**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-10T07:00:00Z
- **Completed:** 2026-03-10T07:12:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Added a shared `DraftAnalysis` contract with stable finding metadata, severity, confidence, and location labels.
- Built reusable draft parsing plus deterministic detectors for long sentences, long paragraphs, and supported filler phrases.
- Added aggregate analyzer fixtures that prove clean drafts, finding metadata, and deterministic ordering.

## task Commits

No task commits were created in this execution session.

## Files Created/Modified
- `src/features/analysis/types.ts` - defines the shared analysis and finding contracts returned by the worker.
- `src/features/analysis/lib/parseDraft.ts` - parses sentence and paragraph spans with counts and offsets.
- `src/features/analysis/lib/findings/detectLengthAndWordiness.ts` - emits deterministic length and filler findings.
- `src/features/analysis/lib/analyzeDraft.ts` - aggregates deterministic findings into one stable ordered result.
- `src/features/analysis/lib/analyzeDraft.test.ts` - covers clean drafts, deterministic findings, and ordering.

## Decisions Made
- Kept snapshot metrics inside the richer analysis result so Phase 3 can extend the Phase 2 UI instead of replacing it.
- Used rule priority plus severity ordering in the analysis layer so later React rendering can stay presentation-only.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The analysis layer now exposes deterministic findings with stable spans for heuristic warnings and UI rendering.
- Phase 3 plan 02 can add passive-voice and tense heuristics without duplicating parsing logic.

---
*Phase: 03-core-findings*
*Completed: 2026-03-10*
