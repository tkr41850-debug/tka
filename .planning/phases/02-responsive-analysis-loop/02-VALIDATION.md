---
phase: 2
slug: responsive-analysis-loop
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-09
---

# Phase 2 - Validation Strategy

> Generated during `/gsd-plan-phase 2`.
> Updated after plan approval.
> Governs feedback sampling during `/gsd-execute-phase 2`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + React Testing Library |
| **Config file** | `vite.config.ts` |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run && npm run build` |
| **Estimated runtime** | ~10 seconds |
| **CI pipeline** | none - local phase verification only |

---

## Nyquist Sampling Rate

> The minimum feedback frequency required to reliably catch errors in this phase.

- **After every task commit:** Run the task's listed `npm run test -- --run ...` command or `npm run build` for the contract-only task.
- **After every plan wave:** Run `npm run test -- --run && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Maximum acceptable task feedback latency:** 10 seconds

---

## Per-task Verification Map

| task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | WORK-03, PERF-02 | typecheck | `npm run build` | ✅ N/A | ⬜ pending |
| 2-01-02 | 01 | 1 | WORK-03, PERF-02 | unit | `npm run test -- --run src/features/analysis/lib/createAnalysisWorkerClient.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 1 | WORK-03, PERF-02 | unit | `npm run test -- --run src/features/analysis/lib/createAnalysisScheduler.test.ts src/features/analysis/lib/createAnalysisWorkerClient.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 2 | WORK-03, WORK-04, PERF-02 | component | `npm run test -- --run src/App.test.tsx` | ✅ after Phase 1 | ⬜ pending |
| 2-02-02 | 02 | 2 | WORK-03, WORK-04, PERF-02 | component | `npm run test -- --run src/App.test.tsx` | ✅ after 2-02-01 | ⬜ pending |
| 2-02-03 | 02 | 2 | WORK-03, WORK-04, PERF-02 | integration | `npm run test -- --run && npm run build` | ✅ after prior tasks | ⬜ pending |

*Status values: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

> Test scaffolding committed before later implementation work depends on it.

- [x] `src/App.test.tsx` - existing UI workflow coverage extended for background analysis behavior
- [x] `src/features/analysis/lib/createAnalysisWorkerClient.test.ts` - worker client message handling and cleanup coverage
- [x] `src/features/analysis/lib/createAnalysisScheduler.test.ts` - debounce, flush, and stale-result suppression coverage

Plan `01` tasks `02` and `03` create the new worker test scaffolding before Wave 2 depends on it, so no separate Wave 0 plan is required.

---

## Manual-Only Verifications

All phase behaviors have automated verification coverage.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands or earlier test-scaffold coverage
- [x] No 3 consecutive implementation tasks without automated verify
- [x] Wave 0 test files cover all MISSING references
- [x] No watch-mode flags in any automated command
- [x] Feedback latency per task: < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Plan-checker approval:** approved on 2026-03-09

---

## Execution Tracking

Updated during `/gsd-execute-phase 2`:

| Wave | Tasks | Tests Run | Pass | Fail | Sampling Status |
|------|-------|-----------|------|------|-----------------|
| 1 | 3 | `npm run build`, `npm run test -- --run src/features/analysis/lib/createAnalysisWorkerClient.test.ts src/features/analysis/lib/createAnalysisScheduler.test.ts` | pending | pending | pending |
| 2 | 3 | `npm run test -- --run src/App.test.tsx`, `npm run test -- --run && npm run build` | pending | pending | pending |

**Phase validation complete:** pending
