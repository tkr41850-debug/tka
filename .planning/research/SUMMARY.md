# Project Research Summary

**Project:** Technical Writing Assistant
**Domain:** Privacy-first local-only technical writing assistant as a standalone static website
**Researched:** 2026-03-08
**Confidence:** MEDIUM

## Executive Summary

Technical Writing Assistant should ship as a focused browser-local prose linter for English technical writing, not as a generic AI copilot, collaboration platform, or integration-heavy editor add-on. The expert pattern across the research is consistent: use a single-page static web app, keep one canonical plain-text workspace in the browser, run analysis off the main thread, and return deterministic findings with explanations, severities, and user-applied rewrite guidance. The app's value is fast, understandable feedback on one text source while keeping all content on-device.

The recommended approach is React + Vite + TypeScript, CodeMirror 6 for the editor, a dedicated analysis worker, `unified`/`retext` for the initial rule pipeline, and IndexedDB for local settings and recovery. Roadmap order matters more than feature count: establish the worker/document seam and privacy contract first, then ship a precision-first rule pack and finding schema, then add accessible review UX plus rule controls, then harden persistence, and only then consider performance upgrades such as incremental analysis or optional WASM. That ordering keeps the project aligned with the narrowed scope: standalone static site, local-only processing, one text source, text-only analysis, and optional WASM only as a measured enhancement.

The main risks are trust and scope. A noisy analyzer, overconfident rewrite suggestions, janky typing despite workers, confusing local storage behavior, or quiet reintroduction of cloud integrations will undermine the product quickly. Mitigation should be explicit in the roadmap: corpus-backed precision gates, conservative advisory copy, user-applied suggestions only, measurable performance budgets, explicit retention rules for stored text, and a hard no-backend/no-cloud/no-multi-source boundary.

## Key Findings

### Recommended Stack

`.planning/research/STACK.md` supports a deliberately small static-web stack: React 19 + Vite 7 + TypeScript 5.9 for the app shell, CodeMirror 6 for plain-text editing, a Web Worker boundary for analysis, `unified`/`retext` for rule execution, and IndexedDB via `idb` for local persistence. The strong recommendation is to start fully in TypeScript and only add WASM inside the worker after profiling shows a real parser or rule bottleneck.

**Core technologies:**
- React `19.2.x`: UI composition for editor, findings, settings, and onboarding - safest mature choice for a client-only greenfield app.
- Vite `7.3.x` + `@vitejs/plugin-react` `5.1.x`: bundling, worker support, static `dist/` output, and optional WASM loading without server assumptions.
- TypeScript `5.9.x`: shared contracts for rules, worker messages, storage schemas, and suggestion models.
- CodeMirror 6 (`@codemirror/view` `6.39.x` + `@codemirror/lint` `6.9.x`): plain-text editor with span-based highlights and diagnostics.
- Web Workers + Comlink `4.4.x`: keep analysis off the main thread and simplify typed worker communication.
- `unified` `11.0.x` + `retext` `9.0.x`: browser-capable English text parsing and rule pipeline for deterministic analysis.
- IndexedDB + `idb` `8.0.x`: structured local persistence for settings, simple local presets, session recovery, and future migrations.
- Optional WASM via Vite native loading: performance enhancement only after measured need, always behind the worker/parser adapter.

### Expected Features

`.planning/research/FEATURES.md` is clear that v1 should behave like a local technical-writing linter with explainable feedback, not like Grammarly-without-the-cloud. The launch bar is a trustworthy single-text workflow with configurable rules, fast local analysis, and accessible issue review. Advanced preset portability, broader rule packs, and deeper parsing are follow-on work once the core loop proves itself.

**Must have (table stakes):**
- One local text workspace with paste/type input and debounced browser-side analysis.
- Highlights plus a prioritized issue list with severity, source mapping, and jump-to-text behavior.
- Explainable guidance with targeted rewrite hints that the user applies manually.
- Core technical-writing rules for sentence length, paragraph length, passive voice, tense drift, jargon/wordiness, and custom banned phrases.
- Rule toggles, thresholds, and local persistence for settings, session state, and at least simple local presets.
- Lightweight onboarding and accessible defaults so first-time users can succeed quickly.

**Should have (competitive):**
- A visible privacy-first local-execution story so the product differentiates itself from cloud writing tools.
- An opinionated technical-writing mode tuned for docs, procedures, and instructional prose rather than generic tone polish.
- Local named presets once the base rule system is stable.
- Optional deeper parsing or accuracy improvements behind WASM if heuristics hit a quality ceiling.

**Defer (v2+ or post-validation):**
- Preset import/export files and broader style packs.
- Installable offline/PWA polish.
- Section-level document summaries or more ambitious document-structure guidance.
- Additional languages, integrations, accounts, collaboration, remote AI, and any non-text analysis.

### Architecture Approach

`.planning/research/ARCHITECTURE.md` recommends a two-runtime browser architecture: the main thread owns rendering, keyboard flow, and UI state; a dedicated worker owns normalization, segmentation, rule evaluation, and suggestion generation; pure domain modules define shared document and finding contracts; and a single persistence repository fronts IndexedDB with OPFS kept optional. The non-negotiable patterns are revisioned document snapshots, one canonical raw text string, shared finding schemas, worker-owned analysis, and a parser adapter that can swap JS for WASM without changing the UI contract.

**Major components:**
1. Workspace and editor shell - owns the one canonical text source, selection, and user-applied edits.
2. Analysis client and dedicated worker - debounces snapshot requests, runs parsing and rules off-thread, and drops stale results by revision.
3. Rule engine and suggestion layer - evaluates deterministic rule modules and produces explanations plus safe next-step suggestions.
4. Findings and settings UI - renders accessible issue review, filters, toggles, thresholds, and onboarding.
5. Persistence repository - stores durable local state such as settings, presets, dismissals, and optional session recovery without mixing in derived analysis.

### Critical Pitfalls

`.planning/research/PITFALLS.md` shows that the main failure modes are not stack selection but product trust, responsiveness, and boundary discipline.

1. **Noisy analyzer** - start with a narrow precision-first rule set, validate against a representative technical-writing corpus, and ship per-rule controls plus dismissals early.
2. **Unsafe rewrite suggestions** - separate detection from rewriting, auto-suggest only low-risk transforms, and make every change user-applied and reversible.
3. **Worker/WASM jank anyway** - set performance budgets early, debounce analysis, cancel stale jobs, keep highlight rendering thin, and lazy-load advanced parsing or WASM.
4. **Local persistence breaks privacy or reliability** - keep retention explicit, prefer IndexedDB over `localStorage`, handle quota and incognito limits, and expose clear local-data deletion.
5. **Scope creep reintroduces cloud or integration work** - freeze the product boundary around one text source, local-only processing, text-only analysis, and static hosting.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Boundary, Shell, and Worker Seam
**Rationale:** The most expensive mistake would be building the analyzer on the main thread or letting cloud or integration assumptions leak back in. Freeze the product boundary and establish the runtime seam before adding feature depth.
**Delivers:** Single-page static shell, plain-text workspace scaffold, revisioned document snapshots, typed worker bridge, self-hosted asset policy, performance and privacy budgets, and explicit scope rules.
**Addresses:** Single local text workspace, verifiable privacy-first local execution.
**Avoids:** Scope creep, main-thread analysis, early performance regressions, and privacy-model drift.

### Phase 2: Deterministic Analyzer MVP
**Rationale:** Trustworthy analysis is the core product. Before advanced presets or polish, the roadmap needs a stable finding schema and a small rule pack that is useful more often than it is noisy.
**Delivers:** Normalize/segment/analyze pipeline in the worker, shared finding and suggestion contracts, issue severities, conservative advisory copy, and the initial technical-writing rules.
**Addresses:** Core technical-writing rule pack, explainable guidance, severity-based results.
**Avoids:** Noisy analysis, unsafe rewrites, and misleading "all clear" semantics.

### Phase 3: Accessible Review UX and Rule Controls
**Rationale:** Once findings exist, users need a usable way to inspect, understand, tune, and dismiss them. This phase converts raw analysis into a trustworthy product surface.
**Delivers:** Editor highlights mapped to stable spans, accessible issue list and detail views, rule toggles, thresholds, dismissals, skippable onboarding, and non-color-only severity cues.
**Addresses:** Highlights plus issue list, rule toggles, thresholds, accessibility, and lightweight onboarding.
**Avoids:** Accessibility retrofits, repeated-warning fatigue, and hover-only or color-only feedback traps.

### Phase 4: Local Persistence and Recovery
**Rationale:** Persistence should land after the session model and settings schema stabilize. That keeps migrations simpler and lets privacy and retention behavior be intentional rather than accidental.
**Delivers:** IndexedDB-backed settings and session persistence, restore flow, clear-local-data UX, quota and incognito handling, and the storage boundary needed for simple local presets.
**Addresses:** Local persistence for settings, session state, and lightweight preset management.
**Avoids:** `localStorage` misuse, silent data retention, unreliable restore behavior, and split-brain persistence.

### Phase 5: Performance Hardening and Optional WASM
**Rationale:** WASM is allowed but optional. Only optimize beyond the worker baseline after measuring real bottlenecks on representative documents and devices.
**Delivers:** Performance instrumentation, stale-job cancellation hardening, lazy-loaded advanced parser path, optional JS-to-WASM parser swap behind the adapter, and selective analysis optimization.
**Addresses:** Optional deeper parsing, higher-accuracy passive-voice and tense handling, and post-launch rule-pack growth.
**Avoids:** Heavy startup costs, unnecessary complexity, and premature commitment to hard-to-port WASM infrastructure.

### Phase Ordering Rationale

- Phase 1 comes first because the worker boundary, revision model, and privacy contract are foundational; retrofitting them later would be the costliest rewrite.
- Phase 2 comes before persistence polish because the product must first prove that its default-on rules are precise, explainable, and worth keeping.
- Phase 3 groups accessibility, controls, and onboarding because all three depend on the stable finding schema and directly affect user trust in the analyzer.
- Phase 4 follows once document, settings, and dismissal schemas stop moving; this matches the architecture guidance to avoid premature migration complexity.
- Phase 5 is intentionally last because optional WASM and deeper optimization are only justified after the JavaScript worker pipeline is measured in realistic use.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Rule precision, gold-corpus design, and acceptable thresholds for passive voice, tense drift, and jargon detection need targeted validation.
- **Phase 5:** Only research deeper if profiling shows a parser bottleneck or if a real WASM library is chosen; browser compatibility and bundle-size tradeoffs then become important.

Phases with standard patterns (skip research-phase):
- **Phase 1:** React/Vite static SPA shell plus worker boundary is well-documented and directly supported by official docs.
- **Phase 3:** Accessible findings lists, live-region status updates, and non-color-only warnings follow established WCAG patterns.
- **Phase 4:** IndexedDB via `idb` is a standard browser persistence pattern as long as OPFS remains optional.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Strong match to the static and local-only constraint set, backed by current official docs and concrete version guidance in `.planning/research/STACK.md`. |
| Features | MEDIUM | Core feature set is coherent, but exact default rule mix, thresholds, and preset needs still need user and corpus validation. |
| Architecture | HIGH | The worker-first, revisioned-snapshot design is a well-supported browser pattern and directly addresses the biggest technical risks. |
| Pitfalls | MEDIUM | Risks are real and well-sourced, but their severity depends on implementation quality and the eventual rule corpus. |

**Overall confidence:** MEDIUM

### Gaps to Address

- Gold corpus and quality gates: define representative technical-writing samples and precision targets before turning new rules on by default.
- Persistence policy: decide whether raw draft recovery is default, opt-in, or session-only so the privacy promise is explicit.
- Browser support envelope: confirm target browsers for IndexedDB, optional OPFS, and optional WASM fallback behavior.
- Suggestion safety boundary: define which rules can offer direct text patches versus explanation-only guidance.
- Launch metrics without telemetry: decide how product validation will work without remote analytics or crash reporting.

## Sources

### Primary (HIGH confidence)
- `/workspace/.planning/PROJECT.md` - core scope, constraints, and narrowed product boundary.
- https://react.dev/blog/2024/12/05/react-19 - React 19 baseline for the SPA shell.
- https://vite.dev/guide/features.html - worker support, TypeScript, and WASM/static asset handling.
- https://vite.dev/guide/static-deploy.html - static deployment model and `dist/` output expectations.
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers - worker boundary behavior and browser support.
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API - browser-native structured persistence guidance.
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria - storage durability, quota, and eviction constraints.
- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live - status announcement pattern for analysis updates.
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html - contrast requirements for highlight and warning UI.
- https://www.w3.org/WAI/WCAG22/Understanding/use-of-color - non-color-only status requirements.

### Secondary (MEDIUM confidence)
- `/workspace/.planning/research/STACK.md` - detailed package and version recommendations.
- `/workspace/.planning/research/FEATURES.md` - MVP boundaries, differentiators, and anti-features.
- `/workspace/.planning/research/ARCHITECTURE.md` - worker-first system design and build-order guidance.
- `/workspace/.planning/research/PITFALLS.md` - phase-specific failure modes and prevention strategies.
- https://developers.google.com/style/voice - voice guidance for technical-writing defaults.
- https://developers.google.com/style/tense - tense guidance for rule direction.
- https://developers.google.com/style/paragraph-structure - paragraph clarity expectations.
- https://developers.google.com/style/inclusive-documentation - inclusive language considerations.
- https://developers.google.com/style/jargon - jargon-reduction guidance.
- https://learn.microsoft.com/en-us/style-guide/bias-free-communication - inclusive technical-writing style guidance.
- https://dev.languagetool.org/developing-robust-rules.html - false-positive reduction guidance for rule authors.

### Tertiary (LOW confidence)
- `/workspace/FinalSpecDraft.md` - broader historical scope used mainly to identify features that should stay out of this roadmap.
- Competitor product pages such as https://www.grammarly.com/, https://www.hemingwayapp.com/, https://languagetool.org/, and https://vale.sh/docs/ - useful for expectation setting, but not authoritative for implementation.

---
*Research completed: 2026-03-08*
*Ready for roadmap: yes*
