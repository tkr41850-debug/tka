---
phase: 4
slug: contextual-review-and-guidance
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-10
---

# Phase 4 - Validation Strategy

> Generated during `/gsd-plan-phase 4 --auto`.
> Approved during planning verification.
> Governs feedback sampling during `/gsd-execute-phase 4`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + React Testing Library |
| **Config file** | `vite.config.ts` |
| **Quick run command** | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts src/features/workspace/lib/applySuggestedRewrite.test.ts src/App.test.tsx` |
| **Full suite command** | `npm run test -- --run && npm run build` |
| **Estimated runtime** | ~15 seconds |
| **CI pipeline** | none - local phase verification only |

---

## Nyquist Sampling Rate

- **After every task commit:** Run the task's targeted `npm run test -- --run ...` command or `npm run build` for contract-only changes.
- **After every plan wave:** Run `npm run test -- --run && npm run build`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Maximum acceptable task feedback latency:** 15 seconds.

---

## Per-task Verification Map

| task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | GUID-01, GUID-02, CLAR-05 | build | `npm run build` | ✅ existing files | ⬜ pending |
| 4-01-02 | 01 | 1 | GUID-01, GUID-02, CLAR-05 | unit | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts` | ✅ existing file | ⬜ pending |
| 4-01-03 | 01 | 1 | GUID-03 | unit + build | `npm run test -- --run src/features/workspace/lib/applySuggestedRewrite.test.ts && npm run build` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 2 | REVW-01, REVW-03 | integration | `npm run test -- --run src/App.test.tsx` | ✅ existing file | ⬜ pending |
| 4-02-02 | 02 | 2 | REVW-01, REVW-03, GUID-01 | integration | `npm run test -- --run src/App.test.tsx` | ✅ after 4-02-01 | ⬜ pending |
| 4-02-03 | 02 | 2 | REVW-01, REVW-03, GUID-01 | integration + build | `npm run test -- --run src/App.test.tsx && npm run build` | ✅ after prior tasks | ⬜ pending |
| 4-03-01 | 03 | 3 | GUID-02, GUID-03 | unit + integration | `npm run test -- --run src/features/workspace/lib/applySuggestedRewrite.test.ts src/App.test.tsx` | ✅ after 4-01-03 | ⬜ pending |
| 4-03-02 | 03 | 3 | GUID-03 | integration | `npm run test -- --run src/App.test.tsx` | ✅ after 4-03-01 | ⬜ pending |
| 4-03-03 | 03 | 3 | REVW-01, REVW-03, GUID-01, GUID-02, GUID-03, CLAR-05 | integration | `npm run test -- --run && npm run build` | ✅ after prior tasks | ⬜ pending |

*Status values: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

- [x] `src/features/workspace/lib/applySuggestedRewrite.test.ts` - planned in Phase 4 plan 01 before later UI actions depend on safe replace and undo behavior

Existing test infrastructure already covers the rest of the phase, so no separate Wave 0 plan is required.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Highlight alignment remains visually believable on narrow and wide layouts | REVW-01 | Pixel alignment of a mirrored textarea overlay is easiest to judge by eye | Run `npm run dev`, load a long sample draft, and confirm highlighted spans stay aligned while scrolling on desktop and mobile widths. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] No 3 consecutive implementation tasks without automated verify
- [x] Wave 0 test files are created before downstream tasks depend on them
- [x] No watch-mode flags in any automated command
- [x] Feedback latency per task stays under 15 seconds
- [x] `nyquist_compliant: true` set in frontmatter

**Plan-checker approval:** approved on 2026-03-10
