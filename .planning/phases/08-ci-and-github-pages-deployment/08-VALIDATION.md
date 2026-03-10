---
phase: 8
slug: ci-and-github-pages-deployment
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-10
---

# Phase 8 - Validation Strategy

> Generated during `/gsd-plan-phase 8 --auto`.
> Approved during planning verification.
> Governs feedback sampling during `/gsd-execute-phase 8`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + React Testing Library + ESLint CLI |
| **Config file** | `vite.config.ts` and `eslint.config.js` |
| **Quick run command** | `npm run lint && npm run test -- --run src/App.test.tsx` |
| **Full suite command** | `npm run lint && npm run test -- --run && npm run build` |
| **Estimated runtime** | ~20 seconds |
| **CI pipeline** | `.github/workflows/ci-pages.yml` - created in this phase |

---

## Nyquist Sampling Rate

- **After every task commit:** Run the task's targeted `npm run ...` command.
- **After every plan wave:** Run `npm run lint && npm run test -- --run && npm run build`.
- **Before `/gsd-verify-work`:** Full suite must be green.
- **Maximum acceptable task feedback latency:** 20 seconds.

---

## Per-task Verification Map

| task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 8-01-01 | 01 | 1 | CI-01 | lint | `npm run lint` | ❌ new config | ⬜ pending |
| 8-01-02 | 01 | 1 | CI-01, CI-02 | workflow + local suite | `npm run lint && npm run test -- --run && npm run build` | ❌ workflow new | ⬜ pending |
| 8-01-03 | 01 | 1 | CI-01, CI-02 | workflow review | `npm run lint` | ✅ after prior tasks | ⬜ pending |
| 8-02-01 | 02 | 2 | DEPLOY-01 | build | `npm run build` | ✅ existing file | ⬜ pending |
| 8-02-02 | 02 | 2 | DEPLOY-02 | integration | `npm run test -- --run src/App.test.tsx` | ✅ existing file | ⬜ pending |
| 8-02-03 | 02 | 2 | DEPLOY-01, DEPLOY-02 | suite + build | `npm run lint && npm run test -- --run src/App.test.tsx && npm run build` | ✅ after prior tasks | ⬜ pending |
| 8-03-01 | 03 | 3 | CI-02, DEPLOY-02 | docs + lint | `npm run lint` | ❌ README new | ⬜ pending |
| 8-03-02 | 03 | 3 | CI-01, DEPLOY-01, DEPLOY-02 | integration + suite | `npm run lint && npm run test -- --run && npm run build` | ✅ after prior tasks | ⬜ pending |
| 8-03-03 | 03 | 3 | CI-01, CI-02, DEPLOY-01, DEPLOY-02 | full phase gate | `npm run lint && npm run test -- --run && npm run build` | ✅ after prior tasks | ⬜ pending |

*Status values: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

Existing test infrastructure covers the app surface and the first plan introduces lint plus workflow files directly - no separate Wave 0 scaffolding is required.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Repository Pages source is set to GitHub Actions and branch protection requires `lint`, `test`, and `build` | CI-02, DEPLOY-01 | Repository settings are outside the checked-in codebase | In GitHub, open Settings -> Pages and confirm the source is GitHub Actions, then open branch protection or rulesets for `main` and verify the named checks are required. |
| Production Pages site shows subtle version info without overpowering the UI | DEPLOY-02 | Final release polish is easier to judge visually than through DOM assertions alone | After a successful deploy, open the live Pages site on desktop and narrow mobile width and confirm the version label is visible but low emphasis. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] No 3 consecutive implementation tasks without automated verify
- [x] Wave 0 test files are not required for this phase
- [x] No watch-mode flags in any automated command
- [x] Feedback latency per task stays under 20 seconds
- [x] `nyquist_compliant: true` set in frontmatter

**Plan-checker approval:** approved on 2026-03-10
