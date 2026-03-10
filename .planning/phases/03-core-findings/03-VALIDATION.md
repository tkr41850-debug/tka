---
phase: 3
slug: core-findings
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-10
---

# Phase 3 - Validation Strategy

> Generated during `/gsd-plan-phase 3 --auto`.
> Approved during planning verification.
> Governs feedback sampling during `/gsd-execute-phase 3`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + React Testing Library |
| **Config file** | `vite.config.ts` |
| **Quick run command** | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts src/features/analysis/lib/findings/detectVoiceAndTense.test.ts src/App.test.tsx` |
| **Full suite command** | `npm run test -- --run && npm run build` |
| **Estimated runtime** | ~12 seconds |
| **CI pipeline** | none - local phase verification only |

---

## Nyquist Sampling Rate

- **After every task commit:** Run the task's targeted `npm run test -- --run ...` command or `npm run build` for contract-only changes.
- **After every plan wave:** Run `npm run test -- --run && npm run build`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Maximum acceptable task feedback latency:** 12 seconds.

---

## Per-task Verification Map

| task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | CLAR-01, CLAR-02, CLAR-06 | unit | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | CLAR-01, CLAR-02, CLAR-06 | unit | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | CLAR-01, CLAR-02, CLAR-06 | build + unit | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts && npm run build` | ✅ after prior tasks | ⬜ pending |
| 3-02-01 | 02 | 2 | CLAR-03, CLAR-04 | unit | `npm run test -- --run src/features/analysis/lib/findings/detectVoiceAndTense.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 2 | CLAR-03, CLAR-04 | unit | `npm run test -- --run src/features/analysis/lib/findings/detectVoiceAndTense.test.ts src/features/analysis/lib/analyzeDraft.test.ts` | ✅ after 3-02-01 | ⬜ pending |
| 3-02-03 | 02 | 2 | CLAR-03, CLAR-04 | unit + build | `npm run test -- --run src/features/analysis/lib/findings/detectVoiceAndTense.test.ts src/features/analysis/lib/analyzeDraft.test.ts && npm run build` | ✅ after prior tasks | ⬜ pending |
| 3-03-01 | 03 | 3 | REVW-02 | component | `npm run test -- --run src/App.test.tsx` | ✅ existing file | ⬜ pending |
| 3-03-02 | 03 | 3 | REVW-02 | component | `npm run test -- --run src/App.test.tsx` | ✅ after 3-03-01 | ⬜ pending |
| 3-03-03 | 03 | 3 | REVW-02, CLAR-01, CLAR-02, CLAR-03, CLAR-04, CLAR-06 | integration | `npm run test -- --run && npm run build` | ✅ after prior tasks | ⬜ pending |

*Status values: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

- [x] `src/features/analysis/lib/analyzeDraft.test.ts` - planned in Phase 3 plan 01 before later rule integration depends on it
- [x] `src/features/analysis/lib/findings/detectVoiceAndTense.test.ts` - planned in Phase 3 plan 02 before heuristic warnings expand the aggregate analyzer

Plan `01` establishes the base analyzer coverage before later plans rely on aggregate ordering, so no separate Wave 0 plan is required.

---

## Manual-Only Verifications

All Phase 3 requirements have automated verification coverage. Optional local UI review may still be useful for copy polish after execution.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] No 3 consecutive implementation tasks without automated verify
- [x] Wave 0 test files are created before downstream tasks depend on them
- [x] No watch-mode flags in any automated command
- [x] Feedback latency per task stays under 12 seconds
- [x] `nyquist_compliant: true` set in frontmatter

**Plan-checker approval:** approved on 2026-03-10
