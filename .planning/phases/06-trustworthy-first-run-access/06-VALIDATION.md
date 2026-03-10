---
phase: 6
slug: trustworthy-first-run-access
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-10
---

# Phase 6 - Validation Strategy

> Generated during `/gsd-plan-phase 6 --auto`.
> Approved during planning verification.
> Governs feedback sampling during `/gsd-execute-phase 6`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + React Testing Library |
| **Config file** | `vite.config.ts` |
| **Quick run command** | `npm run test -- --run src/App.test.tsx` |
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
| 6-01-01 | 01 | 1 | REVW-04, A11Y-02 | build | `npm run build` | ✅ existing files | ⬜ pending |
| 6-01-02 | 01 | 1 | REVW-04, A11Y-02 | integration | `npm run test -- --run src/App.test.tsx` | ✅ existing file | ⬜ pending |
| 6-01-03 | 01 | 1 | REVW-04, A11Y-02 | integration + build | `npm run test -- --run src/App.test.tsx && npm run build` | ✅ after prior tasks | ⬜ pending |
| 6-02-01 | 02 | 2 | A11Y-01, A11Y-02 | integration | `npm run test -- --run src/App.test.tsx` | ✅ existing file | ⬜ pending |
| 6-02-02 | 02 | 2 | A11Y-01, A11Y-02 | integration | `npm run test -- --run src/App.test.tsx` | ✅ after 6-02-01 | ⬜ pending |
| 6-02-03 | 02 | 2 | A11Y-01, A11Y-02 | integration + build | `npm run test -- --run src/App.test.tsx && npm run build` | ✅ after prior tasks | ⬜ pending |
| 6-03-01 | 03 | 3 | A11Y-02 | integration | `npm run test -- --run src/App.test.tsx` | ✅ existing file | ⬜ pending |
| 6-03-02 | 03 | 3 | A11Y-02 | integration | `npm run test -- --run src/App.test.tsx` | ✅ after 6-03-01 | ⬜ pending |
| 6-03-03 | 03 | 3 | A11Y-02 | integration + build | `npm run test -- --run src/App.test.tsx && npm run build` | ✅ after prior tasks | ⬜ pending |
| 6-04-01 | 04 | 4 | REVW-04, A11Y-02 | integration | `npm run test -- --run src/App.test.tsx` | ✅ existing file | ⬜ pending |
| 6-04-02 | 04 | 4 | REVW-04, A11Y-02 | integration | `npm run test -- --run src/App.test.tsx` | ✅ after 6-04-01 | ⬜ pending |
| 6-04-03 | 04 | 4 | REVW-04, A11Y-01, A11Y-02 | integration + build | `npm run test -- --run && npm run build` | ✅ after prior tasks | ⬜ pending |

*Status values: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

Existing test infrastructure covers all phase requirements - no Wave 0 test tasks needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tutorial overlay, severity chips, and dismissal affordances remain readable and orderly on desktop and narrow mobile layouts | A11Y-01, A11Y-02, REVW-04 | Final visual clarity and motion pacing are easier to judge by eye than by DOM assertions alone | Run `npm run dev`, load the app on desktop and a narrow mobile width, open the tutorial, dismiss a finding, and confirm all controls remain visible, focusable, and understandable. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] No 3 consecutive implementation tasks without automated verify
- [x] Wave 0 test files are not required for this phase
- [x] No watch-mode flags in any automated command
- [x] Feedback latency per task stays under 15 seconds
- [x] `nyquist_compliant: true` set in frontmatter

**Plan-checker approval:** approved on 2026-03-10
