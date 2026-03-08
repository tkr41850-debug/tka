# Technical Writing Assistant

## What This Is

Technical Writing Assistant is a privacy-first web app that helps people improve technical writing by analyzing one text source directly in the browser and surfacing clear warnings, explanations, and rewrite guidance. It targets professionals, teachers, and students who need faster feedback on clarity and readability, while staying deployable as a standalone static website with no cloud backend.

## Core Value

Users can paste or type text into a single web page and immediately get useful, local-only feedback that helps them write more clearly.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Analyze a single text source for core clarity, readability, and technical-writing issues inside the browser.
- [ ] Show actionable warnings with explanations, severity, and suggested rewrites without sending text off the static site.
- [ ] Let users enable, disable, and configure rules such as sentence length, paragraph length, banned phrases, and custom thresholds.
- [ ] Preserve local rule presets and session state in the browser so users can return without needing accounts or cloud sync.
- [ ] Provide an approachable, accessible interface and tutorial flow for first-time users.
- [ ] Use browser-native code and optional WASM modules for heavier analysis while keeping deployment fully static.

### Out of Scope

- Third-party integrations with Word, Outlook, Gmail, Google Docs, PowerPoint, or browser extensions — conflicts with the standalone static-site boundary.
- Cloud processing, hosted accounts, remote storage, or server-side AI features — all user content must remain local to the website.
- Multi-source ingestion, background syncing, or collaboration — v1 is limited to one text source at a time.
- Presentation-only visual checks like font-size and slide contrast analysis — the restricted domain is text-only processing.
- Non-English analysis or translation — the current scope is English-only technical writing assistance.

## Context

The starting point is `FinalSpecDraft.md`, which describes a broader technical-writing assistant spanning writing quality, rule configuration, tutorials, presentation checks, integrations, accounts, and bug reporting. For this project initialization, that broader idea is intentionally narrowed to a standalone static website that processes only a single text source and keeps all content on-device in the browser.

The strongest retained value from the draft is real-time help for busy users who need clearer writing fast: sentence and paragraph length checks, passive voice and tense detection, rule toggles, explanations, and practical rewrite suggestions. Features that depend on external apps, cloud services, shared state, or non-text assets are deferred or excluded so the product can ship as a static site.

The product should still feel responsive and polished. More advanced language features can use WASM if needed, but the architecture must remain compatible with static hosting and local browser execution.

## Constraints

- **Deployment**: Standalone static website only — no cloud runtime, backend, or managed service dependencies.
- **Data Handling**: All text stays in the browser — no remote uploads, syncing, telemetry-dependent workflows, or server-side processing.
- **Input Model**: Single source only — v1 analyzes one text workspace at a time.
- **Computation**: Browser-first execution with optional WASM — heavier parsing or analysis must still run client-side.
- **Domain**: Text-only analysis — no image, slide, audio, video, OCR, or multi-modal processing in v1.
- **Language**: English only — inherited from the source draft and current scope reduction.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Ship as a static website | Matches the requested deployment model and removes backend dependency | — Pending |
| Restrict analysis to one text source | Keeps the workflow simple and aligned with local-only processing | — Pending |
| Keep all processing client-side | Protects privacy and satisfies the no-cloud constraint | — Pending |
| Allow WASM for advanced analysis | Makes richer parsing possible without violating static deployment | — Pending |
| Exclude editor integrations and accounts from v1 | They conflict with the narrowed domain and would expand scope substantially | — Pending |

---
*Last updated: 2026-03-08 after initialization from `FinalSpecDraft.md` with static-site constraints*
