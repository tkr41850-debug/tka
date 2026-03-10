# Phase 8: CI and GitHub Pages Deployment - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Add CI checks and GitHub Pages deployment behavior for the existing app. This phase covers when CI and deployment run, what blocks release, how deployment status is surfaced, and how the production Pages site is published. New product capabilities remain out of scope.

</domain>

<decisions>
## Implementation Decisions

### Workflow triggers
- Run CI on all pull requests and all pushes.
- Publish GitHub Pages from the `main` branch only.
- Keep both automatic deployment and a manual deploy trigger.
- Run the full CI pipeline even for docs-only or non-app changes.

### Quality gates
- The required CI checks are `lint`, `test`, and `build`.
- Failing checks block merges to `main`.
- Priority is keeping `main` green.
- Flaky or external failures should fail clearly and be rerun manually.

### Pages release behavior
- Use a single production GitHub Pages site.
- If deployment fails, keep the last good site live.
- Show subtle version information on the live site.
- Deploy only from a successful CI build artifact.

### Failure visibility
- Make failures most visible in pull requests and GitHub Actions.
- For failed deploys from `main`, show a clear failed status that is easy to spot.
- Use clearly named checks for each step rather than a single combined signal.
- Allow manual retry of Pages deployment without changing code.

### OpenCode's Discretion
- Exact workflow file split and naming conventions.
- How artifact handoff is structured between CI and deploy workflows.
- Exact wording and formatting of status names and summaries.

</decisions>

<specifics>
## Specific Ideas

- Keep the deployment model simple: one production Pages site, not preview environments.
- Favor explicit, visible pipeline outcomes over silent retries or hidden automation.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 08-ci-and-github-pages-deployment*
*Context gathered: 2026-03-10*
