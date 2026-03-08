# Pitfalls Research

**Domain:** Privacy-first, local-only technical writing assistant delivered as a standalone static website
**Researched:** 2026-03-08
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Shipping a noisy analyzer that teaches users to ignore the product

**What goes wrong:**
The first usable build flags too much text, fires the same warning repeatedly, and treats weak heuristics as hard errors. Users quickly learn that the tool is more distracting than helpful, disable rules, or stop trusting any warning at all.

**Why it happens:**
Teams start with easy-to-implement rules instead of high-precision rules, tune on a tiny hand-made sample, and optimize for "number of checks" instead of precision. LanguageTool's own rule-authoring guidance explicitly warns teams to test on large corpora to find false alarms and make rules stricter when correct text gets flagged.

**How to avoid:**
Start the roadmap with a narrow, precision-first rule set: sentence length, paragraph length, banned phrases, repeated words, and a small number of explainable clarity checks. Require a gold corpus before adding new default-on rules. Add per-rule enable/disable controls, conservative severities, and a "dismiss / don't show this again" workflow from the first public milestone.

**Warning signs:**
- QA finds obviously acceptable technical prose with multiple warnings.
- Users dismiss or disable the same rule repeatedly.
- More than a small minority of paragraphs in seed docs are highlighted by default.
- Team debates whether warnings are "technically true" instead of whether they are useful.

**Phase to address:**
Phase 2 - Deterministic analyzer MVP with corpus-backed quality gates.

---

### Pitfall 2: Offering rewrite suggestions that sound confident but are semantically wrong

**What goes wrong:**
The app detects a plausible issue, then proposes a rewrite that changes technical meaning, weakens precision, breaks tone, or mishandles quotations, headings, lists, and code-adjacent text. Users stop trusting not just the rewrite, but the diagnosis behind it.

**Why it happens:**
Teams blur detection and rewriting into one step, assume a successful match means they understand intent, and present every suggestion as a "fix". This is especially risky for passive voice, tense, and clarity rules, where a warning may be valid but the best rewrite still depends on context.

**How to avoid:**
Separate issue detection from rewrite generation in the roadmap. In early phases, only auto-suggest rewrites for reversible, low-risk transforms. For ambiguous rules, show the reason, the risky phrase, and one or two example rewrites instead of a one-click replacement. Make every suggestion user-applied, never auto-applied.

**Warning signs:**
- Reviewers agree with the warning but reject the suggested rewrite.
- Suggestions break meaning around domain terms, acronyms, citations, or quoted requirements.
- The same rewrite template appears in very different contexts.
- Team cannot explain why a suggestion is safe beyond "it reads better."

**Phase to address:**
Phase 2 - Rule and suggestion contracts; revisit in Phase 5 only for optional advanced rewrites.

---

### Pitfall 3: Using workers and WASM, but still freezing the editor

**What goes wrong:**
The team says analysis is "off the main thread," yet typing still lags, highlights appear late or out of order, and first load becomes heavy because worker boot, dictionary loading, and WASM compilation all happen before the UI is interactive.

**Why it happens:**
Web workers remove compute from the main thread, but they do not remove rendering cost, diffing cost, or message-copy overhead. MDN notes worker messages are copied by default, not shared, and web.dev warns that off-main-thread architecture improves resilience more than raw speed. Teams still fail by rescanning the full document on each keystroke, posting the whole text to the worker repeatedly, or shipping heavyweight WASM on initial load.

**How to avoid:**
Set explicit performance budgets in the architecture phase: no full-document rescan for every keystroke, no large synchronous saves on input, no advanced analysis before the editor is responsive. Use incremental analysis, cancel stale jobs, batch UI updates, and lazy-load optional WASM only after basic rules are usable. Treat workers as analysis engines and keep DOM annotation logic thin on the main thread.

**Warning signs:**
- Typing latency becomes visible once the document reaches multi-paragraph length.
- Worker job queues back up during fast typing.
- Results flash in and out or arrive for stale text.
- CPU spikes come from highlight rendering even when worker compute looks fine.
- First-use latency is dominated by loading rule packs, dictionaries, or WASM binaries.

**Phase to address:**
Phase 1 - Architecture and budgets; verify in Phase 5 - Performance hardening and optional WASM.

---

### Pitfall 4: Getting local persistence wrong and breaking either privacy or reliability

**What goes wrong:**
The app quietly stores raw drafts longer than users expect, stores too much in `localStorage`, loses drafts during eviction or private browsing, or mixes user text with caches meant only for static assets. The result is either a privacy breach or an "I thought this was saved" failure.

**Why it happens:**
Teams treat `localStorage` as a simple database, even though MDN documents it as synchronous and web.dev recommends avoiding it for substantial data. They also assume browser storage is permanent, even though MDN and web.dev both document quota limits, best-effort eviction, private-browsing deletion, and Safari's proactive cleanup behavior.

**How to avoid:**
Make data retention a roadmap decision, not an implementation detail. Store settings and presets separately from raw text. Default to in-session text unless the user explicitly opts into draft persistence. Use IndexedDB for persisted local content, keep Cache API limited to app assets, handle `QuotaExceededError`, expose "clear local data," and explain that private/incognito sessions and some browsers may clear stored content.

**Warning signs:**
- Save operations block typing or stall the UI.
- Drafts disappear after storage pressure, private browsing, or a period of no use.
- Users cannot tell what is stored locally, for how long, or how to delete it.
- The app persists raw text even when the user expected a temporary session.

**Phase to address:**
Phase 1 - Privacy contract and data model; Phase 4 - Persistence resilience and recovery UX.

---

### Pitfall 5: Retrofitting accessibility onto a highlight-heavy interface

**What goes wrong:**
Warnings are conveyed only by color, explanations only appear on hover, keyboard users cannot reach or dismiss annotations, and screen readers never hear that analysis is running, finished, or found errors. The visual demo looks polished, but a meaningful part of the target audience cannot use it.

**Why it happens:**
Annotation UIs are usually designed visually first. Teams then bolt on ARIA after the interaction model is already built around hover cards, inline highlights, and pointer-only affordances. WCAG guidance explicitly warns against using color alone, requires status messages to be programmatically exposed, and requires hover/focus-triggered content to be dismissible, hoverable, and persistent.

**How to avoid:**
Make the roadmap require two parallel representations of feedback: inline indicators plus an accessible issues list. Every warning must be reachable by keyboard, announced through meaningful status messaging when appropriate, and identifiable without color alone. Tooltip-style explanations must also work on focus and be dismissible without losing context.

**Warning signs:**
- A tester cannot review all issues without a mouse.
- Screen readers do not announce "analysis complete," "n issues found," or validation errors.
- Hover cards vanish when the pointer moves toward them.
- Severity is communicated only by red/yellow/green styling.

**Phase to address:**
Phase 3 - Accessible warning UX before polishing advanced analysis.

---

### Pitfall 6: Reintroducing cloud dependencies through "small" integrations

**What goes wrong:**
The project starts as a static, local-only site, then quietly grows browser-extension ideas, Word or Google Docs integrations, remote bug reporting, hosted AI checks, login, sync, or telemetry. The architecture stops matching the privacy promise and the roadmap fills with work that cannot ship under the stated constraints.

**Why it happens:**
The surrounding problem space is huge, and the original broader spec already includes integrations, bug reporting, accounts, and email enhancement. Greenfield teams often mistake adjacent workflows for MVP requirements and normalize exceptions to the local-only boundary.

**How to avoid:**
Freeze the product boundary in Phase 1: one text source, English only, text only, static hosting only, zero cloud processing, zero account system, zero editor integrations. Treat any feature that requires OAuth, remote APIs, extension injection, cross-document sync, or remote model inference as explicitly out of scope for this roadmap.

**Warning signs:**
- Requirements mention Google Docs, Word, Outlook, Gmail, browser extensions, or background sync.
- Team discussions introduce API keys, auth flows, or server-hosted models.
- Bug reporting or analytics plans require sending usage data off-device.
- "Optional" integrations start blocking core UI decisions.

**Phase to address:**
Phase 1 - Product boundary and architecture scoping.

---

### Pitfall 7: Creating a false sense of correctness with scores, green states, and authoritative language

**What goes wrong:**
Users see "all clear," assume the text is now correct, and ship writing that still has audience, logic, domain, or factual problems. The product accidentally over-claims what a local text-only analyzer can know.

**Why it happens:**
Teams want a clean success state and easy demos, so they compress nuanced guidance into a single score or pass/fail label. But this product's constraints are narrow by design: one source, English only, text only, no fact checking, no external context, and no collaboration signals.

**How to avoid:**
Frame output as advisory, not authoritative. Prefer wording such as "No enabled rules fired" or "All checked rules passed" over "Your writing is correct." Show scope limits in the results model, especially for ambiguous rules. Make it impossible to confuse the absence of warnings with proof of quality.

**Warning signs:**
- Product copy uses words like "fixed," "correct," or "approved."
- PMs ask for a single score before rule coverage is stable.
- Users stop proofreading after reaching a green state.
- QA can produce weak writing that passes because the analyzer simply does not check that dimension.

**Phase to address:**
Phase 2 - Result semantics and copy model; reinforce in Phase 3 UX review.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store full drafts in `localStorage` because it is easy | Fast prototype persistence | UI blocking, 5 MiB ceiling, awkward recovery, privacy confusion | Only for tiny non-sensitive preference flags; never for primary text |
| Re-run every rule against the full document on every input event | Simplest mental model | Typing lag, stale results, worker backlog, battery drain | MVP-only for very small texts and very few rules |
| Return inline rewrite text directly from each rule | Fast demos | Hard-to-audit semantics, duplicated logic, risky suggestions | Only for low-risk deterministic transforms |
| Couple DOM highlighting to analyzer internals | Fewer layers at first | Hard to change UI, hard to add accessibility, fragile offset handling | Never beyond a throwaway prototype |
| Ship all optional WASM assets on first load | Simplifies deployment | Slower startup, wasted bandwidth, poor first-use experience | Never if basic rules can run without WASM |
| Add one analytics or error-reporting SDK "just for launch" | Quick product visibility | Breaks privacy promise, complicates compliance and trust | Never under the current project constraints |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Editor integrations (`Word`, `Google Docs`, `Outlook`, `Gmail`) | Treating external editor support as a near-term feature instead of a separate product boundary | Keep v1 as paste/type/import-export only; do not let integrations shape the core architecture |
| Cloud grammar or AI APIs | Using remote inference for "better suggestions" while still marketing the app as local-only | Keep all analysis on-device; if a future remote mode exists, it must be a clearly different product mode |
| Telemetry / bug reporting SDKs | Adding remote logging because the site is static and has no other debugging channel | Use local exportable diagnostics and user-controlled copy/download workflows instead |
| CDN-hosted fonts, icon kits, or model files | Assuming third-party static assets are harmless because they do not receive document text directly | Self-host static assets and keep the network graph minimal and auditable |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full-document reanalysis on every keystroke | Visible typing lag, delayed warning churn, high CPU | Debounce input, analyze changed ranges, cancel stale work | Commonly visible once text reaches multi-paragraph / multi-page size |
| Posting the entire document to a worker for every edit | High worker overhead, memory churn, stale results | Send deltas or versioned snapshots less often; batch responses | Breaks sooner on slower devices and when users type quickly |
| Rendering too many inline highlights at once | Scroll jank, selection bugs, unreadable editor | Prioritize top issues, virtualize side lists, aggregate nearby warnings | Shows up before compute is maxed out |
| Loading dictionaries, parsers, and WASM before first interaction | Slow startup, blank loading states, poor mobile experience | Boot core UI first, lazy-load advanced analysis, show progress | Painful on cold cache and low-end mobile devices |
| Saving full text snapshots too frequently | I/O spikes, storage growth, recovery confusion | Save on pause, checkpoint periodically, prune old versions | Breaks with long sessions and large drafts |
| Normalizing text for analysis without stable offset mapping | Highlights point to the wrong span after edits or formatting changes | Preserve source offsets and version analysis results against the exact input text | Shows up as soon as more advanced normalization is added |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Sending analytics, crash data, or remote asset requests from a supposedly private tool | Users' usage metadata leaks; trust is broken even if raw text is local | Keep the app auditable with self-hosted assets and zero third-party telemetry |
| Persisting raw drafts by default without explicit user consent | Sensitive local text remains on shared machines longer than expected | Make draft persistence opt-in and expose one-click local-data deletion |
| Using `localStorage` for primary content | Same-origin scripts can read it, writes block the UI, and users assume it is safer than it is | Store sensitive text minimally and prefer IndexedDB with clear retention controls |
| Placing document text in URLs, downloadable logs, or copied debug payloads by default | Sensitive writing leaks through history, screenshots, clipboard, or support artifacts | Keep diagnostics metadata-only unless the user explicitly exports content |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing warnings while the user is mid-sentence | Feels naggy and unstable; users fight the tool while composing | Wait for short idle periods and re-run only stable checks during active typing |
| Redlining everything equally | Users cannot tell what matters first | Rank by severity and certainty; default to a short, prioritized queue |
| Hover-only explanations | Keyboard and touch users miss essential context | Mirror explanations in a persistent side panel or issue drawer |
| One-click rewrite buttons with no rationale | Users apply changes they do not understand | Explain the rule first, then offer an optional example rewrite |
| Empty state that says "perfect" or "done" | Encourages false confidence | Use scope-aware copy such as "No enabled rules triggered" |
| Tutorial overlays that hide the editor or trap focus | First-use experience becomes more confusing, not less | Keep onboarding skippable, brief, and compatible with keyboard and screen readers |

## "Looks Done But Isn't" Checklist

- [ ] **Core analyzer:** Often missing a gold corpus and false-positive threshold - verify each default-on rule against representative technical writing before launch.
- [ ] **Suggestions:** Often missing a safety boundary - verify every rewrite is user-applied and reversible, or downgrade it to explanation-only.
- [ ] **Performance:** Often missing low-end device validation - verify typing remains responsive on long texts with worker + highlight rendering enabled.
- [ ] **Persistence:** Often missing eviction/incognito behavior - verify quota errors, private browsing, and data clearing flows end predictably.
- [ ] **Accessibility:** Often missing keyboard and screen-reader parity - verify all warnings can be discovered, reviewed, and dismissed without a mouse.
- [ ] **Privacy promise:** Often missing a network audit - verify the shipped app makes no unexpected third-party requests after initial load.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Noisy analysis in production | MEDIUM | Disable or demote the noisiest rules first, publish clearer rule notes, and rebuild the gold corpus before re-enabling |
| Wrong rewrite suggestions | MEDIUM | Convert risky auto-rewrites into explanation-only warnings, add test cases for the failures, and reintroduce only deterministic transforms |
| Worker/performance regressions | MEDIUM | Add instrumentation, cap concurrent jobs, cancel stale analyses, and temporarily gate advanced rules behind an explicit toggle |
| Privacy or persistence mistake | HIGH | Stop the leaking behavior, ship a data-reset migration, document exactly what was stored or requested, and simplify retention defaults |
| Accessibility failures | MEDIUM | Add accessible issue-list fallbacks, live-region/status support, and keyboard review flows before resuming UI polish work |
| Scope creep into integrations | HIGH | Re-baseline the roadmap around the static/local-only contract and cut features that require remote dependencies |
| False sense of correctness | LOW | Rewrite product copy, remove misleading pass/fail labels, and surface coverage limits directly in the results UI |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Shipping a noisy analyzer | Phase 2 - Deterministic analyzer MVP | Default-on rules meet agreed precision thresholds on a representative corpus |
| Semantically wrong suggestions | Phase 2, with Phase 5 reserved for optional advanced rewrites | Every suggestion type has explicit safety rules and review examples |
| Workers/WASM but still janky | Phase 1 architecture budgets, Phase 5 performance hardening | Long-text typing stays responsive and stale worker jobs are cancelled |
| Persistence breaks privacy or reliability | Phase 1 privacy contract, Phase 4 persistence resilience | Users can explain what is stored, delete it, and recover gracefully from quota/incognito limits |
| Accessibility retrofitted too late | Phase 3 accessible warning UX | Keyboard-only and screen-reader review of warnings succeeds end to end |
| Scope creep into integrations | Phase 1 product boundary | Roadmap contains no features that require backend, OAuth, editor injection, or remote inference |
| False sense of correctness | Phase 2 result semantics, reinforced in Phase 3 | UI copy never equates "no warnings" with overall correctness |

## Sources

- HIGH - `/workspace/.planning/PROJECT.md` - hard constraints, scope boundaries, and privacy/local-only requirements.
- MEDIUM - `/workspace/FinalSpecDraft.md` - evidence of likely scope creep areas inherited from the broader concept.
- HIGH - MDN, "Web Storage API" (last modified 2025-02-22): https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
- HIGH - MDN, "Storage quotas and eviction criteria" (last modified 2026-01-05): https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- HIGH - MDN, "Window: localStorage property" (last modified 2025-11-30): https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- HIGH - web.dev, "Storage for the web" (updated 2024-09-23): https://web.dev/articles/storage-for-the-web
- HIGH - MDN, "Using Web Workers" (last modified 2025-09-11): https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
- MEDIUM - web.dev, "Use web workers to run JavaScript off the browser's main thread" (updated 2019-12-05; concept still current): https://web.dev/articles/off-main-thread
- HIGH - W3C WAI, "Understanding SC 1.4.1: Use of Color" (updated 2025-09-16): https://www.w3.org/WAI/WCAG22/Understanding/use-of-color
- HIGH - W3C WAI, "Understanding SC 1.4.13: Content on Hover or Focus" (updated 2026-02-23): https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus
- HIGH - W3C WAI, "Understanding SC 4.1.3: Status Messages" (updated 2026-02-23): https://www.w3.org/WAI/WCAG22/Understanding/status-messages
- MEDIUM - LanguageTool developer docs, "Developing Robust Rules" (official project guidance, undated page): https://dev.languagetool.org/developing-robust-rules.html

---
*Pitfalls research for: privacy-first local technical writing assistant*
*Researched: 2026-03-08*
