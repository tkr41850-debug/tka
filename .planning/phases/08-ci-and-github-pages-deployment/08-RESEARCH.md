# Phase 8: CI and GitHub Pages Deployment - Research

**Researched:** 2026-03-10
**Domain:** GitHub Actions quality gates, Vite static deployment, and GitHub Pages release behavior for the existing privacy-first React app
**Confidence:** HIGH

## Summary

Phase 8 should keep the release path simple: one GitHub Actions workflow can run named `lint`, `test`, and `build` jobs for every push and pull request, then reuse the successful build artifact to deploy GitHub Pages only from `main` or a manual dispatch. The current repository already has deterministic local build and test commands, but it does not yet expose a lint command, GitHub workflow files, or any Pages-aware build configuration.

Because the app is a Vite SPA deployed as static files, the main implementation risks are release-path rather than product-path: the build must use the correct GitHub Pages base path, deployment must only consume the built artifact from the successful workflow run, and failure visibility must stay obvious in GitHub rather than being hidden behind a single monolithic job. GitHub Pages keeps the last good site live until a new deployment succeeds, so the workflow should fail clearly instead of trying to hide or auto-recover flaky releases.

**Primary recommendation:** Add a flat-config ESLint foundation and explicit npm scripts first, then implement one clearly named GitHub Actions workflow with separate `lint`, `test`, `build`, and gated `deploy` jobs, plus a small build-version utility surfaced in the UI and documented repo settings for Pages plus branch protection.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CI-01 | Every pull request and push runs named GitHub Actions checks for `lint`, `test`, and `build`. | Use separate GitHub Actions jobs with stable names so pull requests surface each gate independently. |
| CI-02 | The repository can require those checks to keep `main` green before release. | Keep status names stable and document branch-protection setup around the explicit job names. |
| DEPLOY-01 | Successful `main` builds publish one production GitHub Pages site from the built artifact. | Configure Pages in Actions mode, upload `dist` with `actions/upload-pages-artifact`, and deploy with `actions/deploy-pages` only after the build job succeeds. |
| DEPLOY-02 | The live site shows subtle build-version information and the repository documents a manual redeploy path. | Derive build metadata from GitHub environment variables or package version, render it lightly in the app shell, and document `workflow_dispatch` plus GitHub settings steps. |
</phase_requirements>

## Standard Stack

### Core
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| GitHub Actions | hosted | Run CI and GitHub Pages deployment | Native fit for required pull request visibility, manual reruns, and Pages deployment. |
| GitHub Pages actions | `configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4` | Package and deploy the static site artifact | GitHub's documented custom workflow path for Pages deployments. |
| Existing npm + Vite build | Vite 7.x | Produce the static artifact from the current SPA | The repo already builds to `dist` and needs only Pages-aware base handling. |
| ESLint flat config | current major | Add the missing `lint` quality gate required by context | Lightweight repo-standard way to create deterministic CI lint checks. |

### Supporting
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| `actions/setup-node` with npm cache | current major | Fast dependency install across CI jobs | Use in each Node-based job so CI remains predictable and reasonably quick. |
| `import.meta.env` or generated constants | repo-local | Surface build version metadata in the app | Use for subtle footer or badge-level release information without adding runtime network calls. |
| Dynamic Vite `base` resolution | repo-local | Support repo-scoped GitHub Pages URLs while preserving local dev | Use when building in GitHub Actions so asset URLs work under `/<repo>/`. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| One workflow with separate jobs | Separate CI and deploy workflows linked by `workflow_run` | More artifact handoff complexity for little gain in a small repo. |
| ESLint flat config | Keeping no lint gate | Conflicts with the explicit context requirement for `lint`, `test`, and `build` checks. |
| Dynamic Pages base from repo context | Hard-coded base path | Works for one repository name, but is brittle if the repo is renamed or forked. |
| Deploying after rebuild in deploy job | Deploying the uploaded Pages artifact from the build job | Rebuilding in deploy weakens the guarantee that production matches the successful checked artifact. |

## Architecture Patterns

### Recommended Project Structure
```text
.github/
└── workflows/
    └── ci-pages.yml

src/
├── App.tsx
├── App.test.tsx
└── lib/
    └── buildVersion.ts

eslint.config.js
vite.config.ts
README.md
package.json
```

### Pattern 1: Named quality-gate jobs
**What:** Use separate `lint`, `test`, and `build` jobs instead of a single combined CI job.
**When to use:** All pushes and pull requests.
**Why:** Matches the requested visibility model and keeps branch protection rules explicit.

### Pattern 2: Artifact-first Pages deployment
**What:** Upload the built `dist` output with `actions/upload-pages-artifact` and let the deploy job consume that artifact.
**When to use:** `main` pushes and manual deploy runs.
**Why:** Satisfies the requirement that Pages deploy from a successful CI build artifact instead of a second opaque rebuild.

### Pattern 3: Dynamic Pages base path
**What:** Resolve Vite's `base` from repository context when building in GitHub Actions, while keeping `/` locally.
**When to use:** Static builds destined for GitHub Pages under `https://<owner>.github.io/<repo>/`.
**Why:** Prevents broken asset paths without forcing local development to run under a nested base.

### Pattern 4: Build metadata as subtle UI chrome
**What:** Show the package version and short commit or build identifier in a low-emphasis status area.
**When to use:** Production and preview builds.
**Why:** Gives users and maintainers a lightweight way to confirm what release is live without turning the product UI into an ops dashboard.

### Anti-Patterns to Avoid
- Do not hide all CI behavior inside one opaque job name.
- Do not rebuild different code in the deploy job after the quality gates already passed.
- Do not hard-code a Pages base path that only works for one repository slug.
- Do not make deploy failure invisible through silent retries or `continue-on-error`.
- Do not surface loud release chrome that distracts from the writing workspace.

## Implementation Guidance

### CI workflow structure
- Trigger on `pull_request`, all pushes, and `workflow_dispatch`.
- Keep stable job names: `lint`, `test`, `build`, and `deploy`.
- Use concurrency for Pages deploys so only one production deployment proceeds at a time.
- Restrict the `deploy` job to `main` and only after the `build` job succeeds.

### Lint foundation
- Add an npm `lint` script because the repo currently exposes only `build`, `dev`, `preview`, and `test`.
- Favor a small ESLint flat config with TypeScript, React hooks, and React refresh coverage instead of a broad style-heavy setup.
- Keep lint deterministic in CI by using `npm ci` and a non-watch command.

### Vite and Pages behavior
- Keep local base `/`.
- For GitHub Actions builds, derive the repository slug from `GITHUB_REPOSITORY` and use `/<repo>/` as the build base unless deploying a user root site.
- Keep the output directory as `dist` so Pages artifact upload stays conventional.

### Release visibility and docs
- Add a subtle build/version label inside the shipped UI using package version plus short commit when available.
- Document the required repository settings: Pages source set to GitHub Actions and branch protection requiring the named checks.
- Document the manual redeploy path through the Actions tab or `workflow_dispatch`.

## Common Pitfalls

### Pitfall 1: Pages assets 404 after deploy
**What goes wrong:** The site loads HTML but styles or scripts fail because the build assumed root `/` paths.
**How to avoid:** Make `vite.config.ts` base aware of the repository deployment path in GitHub Actions.

### Pitfall 2: CI passes but production uses different bits
**What goes wrong:** The deploy job rebuilds with different inputs than the checked artifact.
**How to avoid:** Upload the checked `dist` artifact in the build job and deploy that exact artifact.

### Pitfall 3: Required checks drift
**What goes wrong:** Branch protection references old or ambiguous check names, so merges are blocked or under-protected.
**How to avoid:** Keep short stable job names and document them in the repo.

### Pitfall 4: Deploy failures become invisible
**What goes wrong:** Maintainers only see a generic workflow failure and cannot tell whether lint, build, or deploy broke.
**How to avoid:** Keep separate jobs, use clear job names, and add concise workflow summaries for deployment outcomes.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + React Testing Library + ESLint CLI |
| Config file | `vite.config.ts` and `eslint.config.js` |
| Quick run command | `npm run lint && npm run test -- --run src/App.test.tsx` |
| Full suite command | `npm run lint && npm run test -- --run && npm run build` |
| Estimated runtime | ~20 seconds |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CI-01 | Pushes and pull requests have stable `lint`, `test`, and `build` commands ready for workflow use | lint + local command verification | `npm run lint && npm run test -- --run && npm run build` | ❌ lint config new |
| CI-02 | Required check names can be documented and kept stable | workflow + docs review | `npm run lint` | ❌ workflow/docs updates |
| DEPLOY-01 | Main-branch deploy uses the uploaded Pages artifact and gated deploy job | workflow inspection + build | `npm run build` | ❌ workflow update |
| DEPLOY-02 | App renders build version info and repo docs explain manual redeploy | integration + docs review | `npm run test -- --run src/App.test.tsx` | ✅ app test file |

### Nyquist Sampling Rate
- **Minimum sample interval:** After each CI or app-surface task, run the task's targeted command.
- **Full suite trigger:** After every completed plan wave.
- **Phase-complete gate:** `npm run lint && npm run test -- --run && npm run build`
- **Estimated feedback latency per task:** ~20 seconds

### Wave 0 Gaps (must be created before implementation)
- No separate Wave 0 scaffolding is required because existing Vitest coverage already exists and the first plan can add lint plus workflow files directly.

## Sources

### Primary (HIGH confidence)
- Current repo state: `package.json`, `vite.config.ts`, `src/App.tsx`, `src/App.test.tsx`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/phases/08-ci-and-github-pages-deployment/08-CONTEXT.md`
- Vite deployment guide for GitHub Pages: `https://vite.dev/guide/static-deploy.html#github-pages`
- GitHub Pages custom workflow docs: `https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages`

### Secondary (MEDIUM confidence)
- Standard GitHub Actions Node caching and Pages deployment patterns

## Metadata

**Confidence breakdown:**
- Separate named GitHub Actions quality gates: HIGH
- Artifact-first GitHub Pages deploy flow: HIGH
- Dynamic Vite base handling for Pages: HIGH
- Subtle build metadata in the shipped UI: HIGH

**Research date:** 2026-03-10
**Valid until:** 2026-04-09
