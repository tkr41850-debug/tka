# Architecture Research

**Domain:** privacy-first in-browser technical writing assistant (single-source static web app)
**Researched:** 2026-03-08
**Confidence:** HIGH

## Standard Architecture

The right architecture for this product is a browser-local, two-runtime design:

- The main thread owns interaction, rendering, accessibility, and short-lived UI state.
- A single dedicated analysis worker owns expensive text processing.
- Pure domain modules define document models, rules, findings, and suggestions so the same logic is testable outside the browser.
- Local persistence is explicit and asynchronous, with IndexedDB as the default store and OPFS reserved for optional heavy-parser/WASM cases.

This is the best fit for the project constraints because it keeps raw text local, avoids server assumptions, keeps typing responsive on slower devices, and creates clear seams for roadmap phases.

### System Overview

```text
+-----------------------------------------------------------------------+
| Main thread / UI shell                                                |
+-----------------------------------------------------------------------+
| Editor surface | Findings panel | Rule settings | Tutorial | Live region |
+-----------------------------------------------------------------------+
| Workspace store | Analysis client | Persistence repository | A11y layer |
+-----------------------------------------------------------------------+
| Dedicated analysis worker                                             |
+-----------------------------------------------------------------------+
| Snapshot normalizer -> segmenter -> optional parser/WASM adapter      |
| -> rule engine -> suggestion generator -> result diff                 |
+-----------------------------------------------------------------------+
| Local-only platform services                                          |
+-----------------------------------------------------------------------+
| IndexedDB: workspace, presets, dismissals, tutorial state             |
| OPFS (optional): large dictionaries, parser cache, WASM scratch data  |
| Static assets: JS/CSS/WASM bundles from the static host               |
+-----------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Editor workspace | Own the single source text, selection, dirty state, and accepted suggestion application | Main-thread state slice plus plain text editor surface |
| Workspace store | Hold canonical UI-side truth for the current session | Central store with selectors and immutable updates |
| Analysis client | Debounce requests, send revisioned snapshots to the worker, drop stale responses | Typed message bridge around `Worker.postMessage()` |
| Analysis worker | Normalize text, parse structure, run enabled rules, and return findings/suggestions | Dedicated Web Worker with pure domain modules |
| Rule engine | Evaluate enabled rules against a parsed document and emit deterministic findings | Framework-free TypeScript functions |
| Suggestion generator | Turn findings plus local context into rewrite candidates and explanations | Pure functions layered on top of finding metadata |
| Persistence repository | Load/save workspace text, presets, dismissals, and onboarding state | IndexedDB-first repository with migrations and quota handling |
| Optional WASM adapter | Hide heavy parsing behind a stable parser interface with JS fallback | Lazy-loaded WASM inside the worker |
| Accessibility layer | Announce analysis changes, preserve keyboard flow, and provide non-color cues | Live region, focus management, semantic list/navigation helpers |

## Recommended Project Structure

```text
src/
|-- app/                     # bootstrap, top-level shell, global providers
|   |-- state/              # workspace/UI state, selectors, actions
|   |-- messaging/          # worker client, request versioning, cancellation
|   `-- a11y/               # live region, focus manager, keyboard shortcuts
|-- features/
|   |-- workspace/          # editor, status bar, session controls
|   |-- findings/           # warning list, filters, detail drawer
|   |-- rules/              # rule settings, presets, dismissals
|   `-- onboarding/         # tutorial and first-run guidance
|-- domain/
|   |-- document/           # snapshots, spans, revision ids, anchors
|   |-- analysis/           # pipeline contracts, findings schema, stats
|   |-- rules/              # pure rule implementations and config schemas
|   `-- suggestions/        # rewrite builders and explanation models
|-- workers/
|   |-- analysis.worker.ts  # dedicated worker entrypoint
|   |-- pipeline/           # normalize -> parse -> rules -> suggest flow
|   `-- wasm/               # optional WASM loaders and adapters
|-- platform/
|   |-- persistence/        # IndexedDB repositories and schema migrations
|   |-- storage/            # OPFS helpers, import/export, quota checks
|   `-- browser/            # feature detection, lifecycle hooks, perf helpers
|-- shared/
|   |-- contracts/          # message schemas shared by UI and worker
|   |-- fixtures/           # reusable text fixtures for tests
|   `-- utils/              # text span helpers, ids, small pure utilities
|-- tests/
|   |-- domain/             # rule, parser, and suggestion unit tests
|   |-- workers/            # worker contract and stale-result tests
|   `-- accessibility/      # keyboard/live-region/highlight behavior tests
`-- assets/
    `-- wasm/               # optional wasm binaries served statically
```

### Structure Rationale

- **`domain/`:** Keeps the analysis core framework-free so it can run in the worker, in unit tests, and later in optional benchmarking harnesses without UI code.
- **`workers/`:** Gives off-main-thread execution a first-class home from day one, which is much cheaper than trying to move rule logic into workers later.
- **`platform/`:** Isolates browser-only APIs such as IndexedDB, OPFS, lifecycle hooks, and feature detection from the core analysis model.
- **`shared/contracts/`:** Prevents drift between worker request/response payloads and the UI-side consumers.
- **`features/`:** Maps cleanly to roadmap phases: workspace first, findings next, rules/settings after that, onboarding later.

## Build-Order Implications

1. **Establish the document and worker seam first.** Ship the app shell, workspace store, revisioned text snapshots, and typed worker bridge before building many rules. Moving analysis off the main thread later is the most expensive architecture rewrite to avoid.
2. **Define a stable finding/suggestion contract early.** The findings list, highlights, dismissals, export/import, and future advanced rules all depend on a durable output schema.
3. **Add persistence after the session model is stable.** Save raw text, rule presets, dismissals, and onboarding flags only after the workspace shape is clear, so migrations stay simple.
4. **Delay WASM until profiling proves the need.** Start with JavaScript parsers and deterministic rules. Add WASM behind the parser adapter only for demonstrably heavy analysis, not as a default foundation.
5. **Treat incremental analysis as an optimization phase, not a prerequisite.** First make whole-document worker analysis correct; then optimize hot paths by sentence/paragraph invalidation once real bottlenecks are visible.

## Architectural Patterns

### Pattern 1: Revisioned Snapshot Analysis

**What:** Every edit produces a new immutable text snapshot with a monotonically increasing revision id. The worker analyzes snapshots, not the live editor DOM.
**When to use:** Always. This is the core pattern for keeping the UI responsive and results deterministic.
**Trade-offs:** Copies text across the worker boundary, but the control flow is simple, stale results are easy to discard, and the model stays testable.

**Example:**
```typescript
type DocumentSnapshot = {
  revision: number;
  text: string;
  selectionStart: number;
  selectionEnd: number;
  configVersion: number;
};

type AnalysisResponse = {
  revision: number;
  findings: Finding[];
  suggestions: Suggestion[];
};
```

### Pattern 2: Pure Rule Modules with Shared Finding Schema

**What:** Each rule is a pure evaluator that receives parsed text plus rule settings and returns findings in a shared schema. Suggestion generation is separate from the UI and usually separate from the rule's detection logic.
**When to use:** For all clarity, readability, phrasing, and threshold-based checks.
**Trade-offs:** Slightly more boilerplate per rule, but much easier testing, benchmarking, fixture-based QA, and roadmap expansion.

**Example:**
```typescript
type Finding = {
  id: string;
  ruleId: string;
  severity: "info" | "warn" | "error";
  span: { start: number; end: number };
  message: string;
  evidence?: Record<string, unknown>;
};

interface RuleModule {
  id: string;
  evaluate(ctx: RuleContext): Finding[];
}

interface SuggestionProvider {
  forFinding(ctx: SuggestionContext, finding: Finding): Suggestion[];
}
```

### Pattern 3: Worker-Owned Analysis, UI-Owned Interaction State

**What:** The worker owns expensive computation. The main thread owns selection, panel state, focus, and presentation. Neither side directly reaches into the other's responsibilities.
**When to use:** For the entire app lifecycle.
**Trade-offs:** Message contracts must be explicit, but the UI remains smooth and test failures are easier to localize.

**Example:**
```typescript
type AnalyzeRequest = {
  revision: number;
  text: string;
  enabledRuleIds: string[];
  settings: RuleSettings;
};

worker.postMessage(request);

worker.onmessage = (event) => {
  if (event.data.revision < latestRevision) return; // stale result
  analysisStore.apply(event.data);
};
```

### Pattern 4: Optional WASM Behind a Parser Adapter

**What:** Hide heavy sentence segmentation, tokenization, or syntax parsing behind one parser interface. The worker can use a JS implementation by default and swap to WASM when advanced rules require it.
**When to use:** Only for measurable hotspots such as large-document parsing or linguistically richer rules.
**Trade-offs:** Adapter indirection adds some complexity, but it prevents the rest of the codebase from depending on WASM-specific details.

**Example:**
```typescript
interface SyntaxAnalyzer {
  parse(text: string): Promise<ParsedDocument>;
}

class JsSyntaxAnalyzer implements SyntaxAnalyzer {}
class WasmSyntaxAnalyzer implements SyntaxAnalyzer {}
```

## Data Flow

### Request Flow

```text
[User types or pastes text]
        |
        v
[Workspace store updates sourceText + revision]
        |
        v
[Debounced analysis client posts snapshot]
        |
        v
[Analysis worker normalizes -> parses -> runs rules -> builds suggestions]
        |
        v
[Worker returns revisioned result]
        |
        v
[Main thread drops stale results and updates findings state]
        |
        v
[Editor highlights + findings list + live region summary]
        |
        v
[Idle autosave persists raw text and settings locally]
```

### State Management

```text
[Workspace Store]
    |  source text, revision, selection, save status
    v
[Analysis Client] <-----> [Analysis Worker]
    |                           |
    v                           v
[Analysis Result Store]     [Pure Domain Modules]
    |
    v
[UI Components]
    |
    v
[Persistence Repository] -> [IndexedDB / OPFS]
```

### Key Data Flows

1. **Editing loop:** Text input updates the workspace store immediately; analysis runs after a short debounce in the worker; stale results are ignored by revision id.
2. **Rule configuration loop:** Toggling a rule or changing a threshold updates settings in the store, triggers re-analysis with a new config version, and then persists the settings asynchronously.
3. **Suggestion acceptance loop:** The user accepts a suggestion in the findings panel, the workspace store applies the text patch to the canonical string, and the next revision is re-analyzed like any other edit.
4. **Session restore loop:** On startup the persistence repository restores the last local workspace, presets, and dismissals before the first worker run.
5. **Dismissal loop:** A dismissal records `ruleId + anchor` metadata locally; the UI filters matching findings without mutating rule code, and dismissals are revalidated after edits.

## Editor and Workspace State

- Keep **one canonical raw text string** as the source of truth. Do not treat highlighted DOM ranges, rendered markup, or editor decorations as canonical state.
- Separate workspace state into three slices:
  - **Document state:** raw text, revision, selection, undo-safe patches.
  - **Analysis state:** latest completed findings/suggestions/stats keyed by revision.
  - **UI state:** active panel, selected finding, filters, tutorial progress, focus return target.
- Persist only the state that matters across reloads: raw text, enabled rules, thresholds, dismissals, and tutorial completion. Treat parsed ASTs, transient highlights, and computed stats as disposable caches.
- For roadmap safety, make suggestion application produce text patches, not DOM edits. That keeps the same acceptance flow usable whether suggestions come from simple threshold rules or later from a richer parser.

## Rule Engine and Analysis Pipeline

Recommended pipeline order:

1. **Normalize** input (line endings, whitespace policy, empty-paragraph handling).
2. **Segment** into paragraphs/sentences/tokens with stable span offsets.
3. **Parse** optional deeper structure through a parser adapter.
4. **Evaluate** enabled rules as pure modules.
5. **Aggregate** findings into severity groups and summary stats.
6. **Generate suggestions** from findings and nearby context.
7. **Diff results** against the previous completed revision so the UI can update incrementally.

Specific guidance:

- Use a **shared document model** for rules. Sentence length, paragraph length, passive voice, tense checks, and banned-phrase rules should all read from the same parsed snapshot instead of reparsing independently.
- Keep rules **deterministic and local**. Because this product is privacy-first and browser-only, avoid any rule design that assumes remote models, hosted dictionaries, or server-provided explanations.
- Design findings with stable fields from the start: `id`, `ruleId`, `severity`, `span`, `message`, `evidence`, and optional `suggestionIds`.
- Suggestion generation should remain a **second phase** after detection. Detection answers "what is wrong"; suggestion generation answers "what can the user do next." That separation keeps rule tests smaller and future advanced suggestion strategies swappable.

## Local Persistence Strategy

- **Use IndexedDB as the default persistent store.** It is asynchronous, can store structured data, and is available from workers as well as the main thread according to MDN. It is the best default for workspace text, presets, dismissals, migrations, and tutorial flags.
- **Use OPFS only when needed.** OPFS is appropriate for large user dictionaries, cached parser resources, or WASM scratch files where file-like access or worker-local sync handles help. It is not required for the initial app architecture.
- **Assume best-effort storage unless persistence is granted.** Browser storage can be evicted; design export/import and recovery messaging accordingly.
- **Write asynchronously and in batches.** Save on idle, on explicit actions, and on page lifecycle events. Do not persist on every keystroke.
- **Keep one repository interface.** Even if IndexedDB and OPFS both exist under the hood, the rest of the app should talk to one persistence boundary.

## Optional WASM Worker Boundaries

- Keep WASM **inside the analysis worker boundary**, not in the main thread. That preserves UI responsiveness and keeps fallback logic contained.
- Prefer **single-threaded WASM by default**. Multithreaded WASM and `SharedArrayBuffer` depend on cross-origin isolation headers (`COOP`/`COEP`) and should not be assumed for every static host.
- Load WASM **lazily** when a rule set actually needs it. The first meaningful analysis should not block on downloading heavy binaries if simple rules can run in plain JavaScript.
- Return normal JavaScript data structures from the worker. The UI should not know or care whether a result came from JS or WASM internals.
- If very large buffers must cross the worker boundary, prefer **transferable `ArrayBuffer`** patterns over repeated structured clones.

## Accessibility and Performance Concerns

- Keep keyboard users in control: warnings panel, settings, and tutorial overlays must all have predictable focus entry/exit and never steal focus on every re-analysis.
- Announce summary-level changes through an **`aria-live="polite"`** region; do not narrate every keystroke-level finding change.
- Do not rely on color alone for highlights. Include icons, text labels, list entries, and active selection states. Highlight and warning text should meet WCAG 2.2 contrast requirements.
- Keep the editor responsive by budgeting main-thread work to input handling, rendering, and state updates only. Parsing and rule evaluation belong in the worker.
- Optimize in this order: worker boundary first, debounce and stale-result dropping second, lazy-load heavy assets third, incremental invalidation fourth.
- Measure the right bottlenecks: document size, rule count, parser startup, and low-end device latency. In a static app, client device performance matters far more than host capacity.

## Scaling Considerations

For this product, scaling is mostly about **document size, rule count, bundle size, and browser storage behavior**, not backend throughput.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | No runtime architecture change. A static host plus one dedicated worker is sufficient; focus on correctness and fast first analysis. |
| 1k-100k users | Still no backend split. Optimize static asset caching, lazy-load advanced parser/WASM bundles, and version storage migrations carefully. |
| 100k+ users | Hosting is still mostly a CDN concern. Runtime architecture stays client-local; major work is backwards-compatible schema migration, offline asset stability, and bundle discipline. |

### Scaling Priorities

1. **First bottleneck:** whole-document re-analysis on slower devices. Fix with revision dropping, debounced requests, shared parsing, and only later sentence/paragraph invalidation.
2. **Second bottleneck:** startup cost from large parser or WASM assets. Fix with code splitting, lazy initialization, and keeping baseline rules in JavaScript.

## Anti-Patterns

### Anti-Pattern 1: Main-thread NLP

**What people do:** Run parsing, rule evaluation, and suggestion generation directly in UI event handlers.
**Why it's wrong:** Typing latency spikes immediately, especially on large documents or low-end laptops.
**Do this instead:** Send revisioned snapshots to a dedicated analysis worker and keep the main thread focused on interaction.

### Anti-Pattern 2: Editor DOM as the Source of Truth

**What people do:** Derive findings from rendered spans, highlights, or `contenteditable` DOM structure.
**Why it's wrong:** Decorations become entangled with analysis, offsets drift, and suggestion application becomes brittle.
**Do this instead:** Keep one canonical plain-text document model and map findings to render-time decorations.

### Anti-Pattern 3: Reparse Per Rule

**What people do:** Each rule tokenizes or segments the text independently.
**Why it's wrong:** CPU cost grows linearly with every added rule and results drift when parsers disagree.
**Do this instead:** Share one normalized document snapshot and let rules read from that common structure.

### Anti-Pattern 4: Persist Derived Analysis as Canonical State

**What people do:** Store findings, highlights, and parser output as long-lived truth in local storage.
**Why it's wrong:** The data becomes stale after edits, bloats origin storage, and complicates migrations.
**Do this instead:** Persist raw text, settings, and dismissals; recompute analysis from the current text.

### Anti-Pattern 5: Split-Brain Persistence

**What people do:** Put some settings in `localStorage`, drafts in IndexedDB, and custom data in ad hoc browser APIs with no single schema owner.
**Why it's wrong:** Recovery, migrations, and quota handling become unpredictable. `localStorage` is synchronous and small.
**Do this instead:** Put durable app state behind one asynchronous repository, using IndexedDB first and OPFS only for specific heavy-data cases.

### Anti-Pattern 6: Assuming Shared Memory or Server Headers

**What people do:** Plan around `SharedArrayBuffer`, multithreaded WASM, or server-tuned headers from the start.
**Why it's wrong:** Cross-origin isolation requires specific response headers and static hosts do not always expose that control.
**Do this instead:** Default to single-threaded WASM and transferable buffers; treat shared memory as an optional deployment-specific enhancement.

### Anti-Pattern 7: Fake Backend Abstractions in a No-Backend Product

**What people do:** Build auth-ready APIs, remote sync queues, server ids, or telemetry pipelines "for later."
**Why it's wrong:** It adds complexity that conflicts with the static-only and privacy-first constraints.
**Do this instead:** Model local-only workflows directly and add future boundaries only when the product scope actually changes.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Static file host / CDN | Serve versioned JS, CSS, and optional WASM assets over HTTPS | No user text leaves the browser; host only serves static assets |
| Browser storage subsystem | Access through repository adapters | IndexedDB is primary; OPFS is optional and secure-context-only |
| Optional service worker | Cache static assets only | Useful for startup/offline polish, but not required for core analysis and should not change the privacy model |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Workspace store <-> analysis client | Typed actions/selectors | Workspace owns text revisions; analysis client never mutates editor state directly |
| Analysis client <-> analysis worker | `postMessage()` with shared contracts | Always include revision ids and config versions |
| Analysis worker <-> rule modules | In-process function calls | Keep rule inputs/outputs pure and deterministic |
| Analysis worker <-> WASM adapter | Parser interface | JS fallback and WASM implementation must return the same parsed schema |
| Workspace store <-> persistence repository | Async commands | Persist only durable local state |
| Findings UI <-> editor surface | Stable finding ids and text spans | Never couple UI selection to DOM node identity |

## Sources

- MDN, Using Web Workers: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
- MDN, Transferable objects: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects
- MDN, IndexedDB API: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- MDN, Storage quotas and eviction criteria: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- MDN, Origin private file system: https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
- MDN, Loading and running WebAssembly code: https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Loading_and_running
- MDN, SharedArrayBuffer: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
- MDN, Window.crossOriginIsolated: https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated
- MDN, ARIA `aria-live`: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live
- W3C WAI, WCAG 2.2 Contrast (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Project context, `PROJECT.md`: /workspace/.planning/PROJECT.md
- Secondary project context, `FinalSpecDraft.md`: /workspace/FinalSpecDraft.md

---
*Architecture research for: privacy-first technical writing assistant*
*Researched: 2026-03-08*
