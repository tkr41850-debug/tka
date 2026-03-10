---
phase: 5
slug: rule-tuning-and-custom-detection
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-10
---

# Phase 5 - Validation Strategy

> Generated during `/gsd-plan-phase 5 --auto`.
> Approved during planning verification.
> Governs feedback sampling during `/gsd-execute-phase 5`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + React Testing Library |
| **Config file** | `vite.config.ts` |
| **Quick run command** | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts src/App.test.tsx` |
| **Full suite command** | `npm run test -- --run && npm run build` |
| **Estimated runtime** | ~15 seconds |
| **CI pipeline** | none - local phase verification only |

---

## Nyquist Sampling Rate

- **After every task commit:** Run the task's targeted `npm run test -- --run ...` command.
- **After every plan wave:** Run `npm run test -- --run && npm run build`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Maximum acceptable task feedback latency:** 15 seconds.

---

## Per-task Verification Map

| task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | RULE-01, RULE-02, RULE-03 | unit + build | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts && npm run build` | ✅ existing file | ⬜ pending |
| 5-01-02 | 01 | 1 | RULE-01, RULE-02, RULE-03, CLAR-07 | unit | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts` | ✅ existing file | ⬜ pending |
| 5-01-03 | 01 | 1 | RULE-02, RULE-03, CLAR-07 | unit + build | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts && npm run build` | ✅ existing file | ⬜ pending |
| 5-02-01 | 02 | 2 | RULE-01, RULE-02, RULE-03 | integration | `npm run test -- --run src/App.test.tsx` | ✅ existing file | ⬜ pending |
| 5-02-02 | 02 | 2 | RULE-01, RULE-02, RULE-03 | integration | `npm run test -- --run src/App.test.tsx` | ✅ after 5-02-01 | ⬜ pending |
| 5-02-03 | 02 | 2 | RULE-01, RULE-02, RULE-03 | integration + build | `npm run test -- --run src/App.test.tsx && npm run build` | ✅ after prior tasks | ⬜ pending |
| 5-03-01 | 03 | 3 | RULE-01, RULE-02 | integration | `npm run test -- --run src/App.test.tsx` | ✅ existing file | ⬜ pending |
| 5-03-02 | 03 | 3 | RULE-01, RULE-02 | integration | `npm run test -- --run src/App.test.tsx` | ✅ after 5-03-01 | ⬜ pending |
| 5-03-03 | 03 | 3 | RULE-01, RULE-02 | integration + build | `npm run test -- --run src/App.test.tsx && npm run build` | ✅ after prior tasks | ⬜ pending |
| 5-04-01 | 04 | 4 | RULE-03, CLAR-07 | integration | `npm run test -- --run src/App.test.tsx` | ✅ existing file | ⬜ pending |
| 5-04-02 | 04 | 4 | RULE-03, CLAR-07 | integration | `npm run test -- --run src/App.test.tsx` | ✅ after 5-04-01 | ⬜ pending |
| 5-04-03 | 04 | 4 | RULE-01, RULE-02, RULE-03, CLAR-07 | integration + build | `npm run test -- --run && npm run build` | ✅ after prior tasks | ⬜ pending |

*Status values: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

Existing test infrastructure covers all phase requirements - no Wave 0 test tasks needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Settings panel remains readable beside the editor on wide and stacked layouts | RULE-01, RULE-02, RULE-03 | Final visual balance is easier to judge by eye than by DOM assertions alone | Run `npm run dev`, open a long sample draft, and confirm the settings panel remains usable on desktop and narrow mobile widths while findings update live. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] No 3 consecutive implementation tasks without automated verify
- [x] Wave 0 test files are not required for this phase
- [x] No watch-mode flags in any automated command
- [x] Feedback latency per task stays under 15 seconds
- [x] `nyquist_compliant: true` set in frontmatter

**Plan-checker approval:** approved on 2026-03-10
