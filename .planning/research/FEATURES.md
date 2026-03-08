# Feature Research

**Domain:** Privacy-first technical writing assistant as a standalone static website for one English text source
**Researched:** 2026-03-08
**Confidence:** MEDIUM

## Feature Landscape

Opinionated call: this product should behave like a local prose linter for technical clarity, not a mini-Grammarly clone and not an AI copilot. The winning shape is: paste text, get fast local feedback, understand exactly why each warning exists, tune the rules, and leave with cleaner writing. Anything that needs remote context, multi-app reach, or large-model generation should be treated as scope expansion, not as baseline.

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Single local text workspace with fast analysis | Hemingway, LanguageTool, and Grammarly all start with immediate text checking; `PROJECT.md` makes single-source paste/type the core loop | MEDIUM | One workspace only; debounce scans instead of trying to lint every keystroke synchronously |
| Clear issue display: highlights, issue list, severity | Users expect to see exactly where the problem is and how serious it is, not just a score | HIGH | Needs stable offset-to-range mapping in the browser; likely a mirrored overlay or controlled editor surface |
| Explainable guidance with suggested rewrites | Current tools pair detection with improvement suggestions, and `PROJECT.md` explicitly requires explanations plus rewrite guidance | MEDIUM | Use targeted rewrite patterns and examples, not free-form generation |
| Core technical-writing rule pack | Google and Microsoft style guidance both emphasize active voice, present tense, scannable paragraphs, inclusive wording, and reduced jargon | HIGH | v1 rule pack should cover sentence length, paragraph length, passive voice, tense drift, wordiness/jargon, and banned/custom phrases |
| Rule toggles, thresholds, and custom banned phrases | Technical writing is style-guide dependent; Vale and Grammarly both show users want to adapt rules to local standards | MEDIUM | This belongs in v1, not later, because the same text can be "wrong" under one house style and fine under another |
| Local persistence for session state and presets | A privacy-first product without accounts still needs continuity between visits | LOW | Store locally only; no sync service; named presets can start simple |
| Lightweight onboarding and accessible UX | A standalone site has no host-editor context to teach the user where features live; `PROJECT.md` explicitly calls for an approachable tutorial flow | LOW | Keep v1 to empty-state guidance and short coach marks, not a long forced tour |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Verifiable privacy-first local execution | This is the clearest wedge against cloud writing tools: no account, no upload, no server-side processing | MEDIUM | Make the privacy boundary visible in product copy and architecture choices; optional offline/PWA support later strengthens this |
| Technical-writing mode instead of generic "better writing" mode | Docs, procedures, and instructional prose need different defaults than sales copy or casual email | MEDIUM | Favor active voice, present tense, scannable paragraphs, explicit actors, inclusive language, and jargon reduction over brand-tone polish |
| Explainability-first feedback | Trust is higher when each warning says what triggered it, why it matters, and how to fix it | MEDIUM | Strong fit for teachers, students, and professionals who want to learn, not just accept edits blindly |
| Local custom style presets | Lets users switch between contexts such as docs, class materials, reports, and internal notes without needing accounts or admin tooling | MEDIUM | Start with named local presets; add import/export files only after users prove they need portability |
| Optional WASM-powered deeper parsing | Gives room for better passive-voice and tense detection without breaking the static-site constraint | HIGH | Treat as progressive enhancement; heuristic rules should still work when WASM is unavailable |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Word, Google Docs, Gmail, Outlook, and PowerPoint integrations | Users want feedback where they already write | This breaks the standalone static-site boundary and drags the product into extension/plugin maintenance; it also re-expands the original scope from `FinalSpecDraft.md` | Keep copy/paste as the only ingestion path in v1 |
| Accounts, cloud sync, team workspaces, and collaboration | Users want settings across devices and shared styles | Violates the no-cloud/no-collaboration requirement and forces backend, auth, storage, and permissions work | Use local presets only; if needed later, allow manual preset import/export files |
| Full-document AI rewrite, chat assistant, or paraphrasing copilot | Users associate writing assistants with "fix this for me" automation | Cloud models violate the privacy boundary, while serious local models bloat a static app; full rewrites also hide the reasoning and change author voice | Offer per-issue rewrite patterns, before/after examples, and user-applied suggestions |
| Presentation and visual analysis such as font size, contrast, slides, images, audio, or OCR | The original draft mixed writing help with presentation review | Hard conflict with the text-only constraint; this becomes a different product surface entirely | Stay focused on prose clarity inside one text workspace |
| Email enhancer with recipient-aware suggestions | People often want help sounding more professional in email | Recipient/context awareness usually depends on the host app and message metadata, which a standalone page does not have | If validated later, add generic checks for terse openings, missing context, and weak closings inside plain text |
| Plagiarism checking, fact checking, citation lookup, AI detection, or web-grounded verification | These are common writing-tool asks, especially in education | They need remote corpora, search, or reference datasets and do not fit the local-only/browser-only boundary | Keep the tool scoped to prose quality and clarity, not truth verification |
| Server-backed bug reporting, analytics, or crash uploads | Useful for improving the product over time | Needs backend collection and creates privacy questions around user content | Offer user-triggered local diagnostic export or copyable debug info only |

### Ideas From `FinalSpecDraft.md` That Do Not Fit This Narrowed Scope

- `Background Color Adjuster` and `Font Size Checker` do not fit because the new product is text-only, not slide or visual analysis.
- Integrations with Microsoft Word, Outlook, Gmail, Google Docs, and PowerPoint do not fit because v1 is a standalone static website, not an extension ecosystem.
- The account system, Google login, and university-email login do not fit because v1 has no cloud accounts or remote storage.
- `Bug Reporting` as a server workflow does not fit because the static-site scope has no backend or crash-report collection service.
- `Document Overview` as a summarizer does not fit v1 because it shifts the tool toward generative summarization instead of actionable writing improvement.
- `Email Enhancer` does not fit as written because it assumes email-specific context and integration rather than neutral single-text analysis.
- Presentation accessibility checks do not fit this product; the only accessibility work that remains in scope is the website UI itself.

## Feature Dependencies

```text
[Single text workspace]
    └──requires──> [Local analysis pipeline]
                       ├──requires──> [Sentence/paragraph segmentation]
                       │                  ├──enables──> [Length and readability rules]
                       │                  └──enables──> [Highlight-to-source mapping]
                       └──requires──> [Rule engine + issue schema]
                                          ├──enables──> [Severity, explanations, suggestions]
                                          └──enables──> [Rule toggles and thresholds]

[Custom banned phrases + thresholds]
    └──requires──> [Stable rule identifiers and local persistence]

[Named presets]
    └──requires──> [Rule toggles and thresholds]

[Lightweight onboarding]
    └──enhances──> [Rule toggles and settings discoverability]

[Optional WASM parsing] ──enhances──> [Passive voice and tense accuracy]

[Heavy WASM/NLP rules] ──conflicts──> [Per-keystroke instant updates]
[Forced full-screen tutorial] ──conflicts──> [Paste-and-check immediacy]
[Cloud sync/accounts] ──conflicts──> [Privacy-first local-only promise]
[Editor integrations] ──conflicts──> [Standalone static-site boundary]
```

### Dependency Notes

- **Single text workspace requires the local analysis pipeline:** there is no product without fast browser-side parsing and scanning.
- **Sentence and paragraph segmentation require stable source mapping:** sentence-length and paragraph warnings are only useful if the user can jump to the exact offending text.
- **Rule engine plus issue schema requires early standardization:** severity, explanations, suggestions, toggles, and persistence all depend on the same canonical rule IDs and issue shape.
- **Custom thresholds require local persistence:** once users tune sentence limits or banned terms, losing those settings makes the product feel disposable.
- **Optional WASM parsing enhances passive voice and tense accuracy:** ship heuristic detection first, then upgrade the hardest rules if precision proves insufficient.
- **Heavy NLP conflicts with instant updates:** roadmap order should favor responsive debounced scans before adding expensive analysis.
- **A forced tutorial conflicts with fast first use:** onboarding should be skippable and short so users can paste text immediately.

## MVP Definition

The MVP should be ruthless: a local technical-writing linter with guided fixes. It should not try to become a full grammar suite, collaboration platform, or AI writer.

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] One text workspace with paste/type input and debounced local analysis — validates the single-source privacy-first loop
- [ ] Explainable issue list with highlights, severity, and targeted rewrite hints — proves the product helps users improve real text
- [ ] Small, opinionated technical-writing rule pack — sentence length, paragraph length, passive voice, tense drift, jargon/wordiness, and custom banned phrases cover the highest-value clarity issues
- [ ] Rule toggles, thresholds, and local persistence — technical writing needs configurability from day one, not after launch
- [ ] Lightweight empty-state onboarding plus accessible defaults — enough guidance to make the tool usable without adding tutorial bloat

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Named preset management and preset import/export files — add when users show real need to reuse settings across contexts or devices
- [ ] Broader style packs for inclusive language, terminology consistency, and domain jargon — add after the base rule pack earns trust
- [ ] Optional WASM upgrades for the hardest rules — add when heuristic accuracy becomes the limiting factor

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Installable/offline-first PWA polish — valuable, but not required to validate whether users want the core analysis loop
- [ ] More ambitious document-structure guidance such as section-level hotspot summaries — useful later, but not before the issue-level workflow works well
- [ ] Additional languages — explicitly out of scope for now and too large to combine with English v1 validation

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Single local text workspace | HIGH | MEDIUM | P1 |
| Issue highlights + list + severity | HIGH | HIGH | P1 |
| Explainable rewrite guidance | HIGH | MEDIUM | P1 |
| Core technical-writing rule pack | HIGH | HIGH | P1 |
| Rule toggles, thresholds, local persistence | HIGH | MEDIUM | P1 |
| Lightweight onboarding/accessibility | MEDIUM | LOW | P1 |
| Named local presets and file import/export | MEDIUM | MEDIUM | P2 |
| Optional WASM parser upgrades | MEDIUM | HIGH | P2 |
| Installable PWA polish | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Grammarly | Hemingway | Vale | Our Approach |
|---------|-----------|-----------|------|--------------|
| Core feedback model | Broad cloud AI writing help, tone, rewrites, and many adjunct tools | Editor-centric readability and clarity feedback | Prose linting framework, not a general writing assistant | Narrow local clarity assistant for technical prose with explainable fixes |
| Custom style control | Paid style-guide and brand controls in higher tiers | Limited compared with lint-style tools | Strong custom rules and style packages | Simple local thresholds, banned phrases, and presets without accounts |
| Delivery model | Account-centric, cross-app, multi-platform service | Single-editor product family with online and desktop products | CLI/editor tooling for writers and docs teams | One standalone static website, one text source, no integrations |

## Sources

- `/workspace/.planning/PROJECT.md`
- `/workspace/FinalSpecDraft.md`
- https://developers.google.com/style/voice
- https://developers.google.com/style/tense
- https://developers.google.com/style/paragraph-structure
- https://developers.google.com/style/inclusive-documentation
- https://developers.google.com/style/jargon
- https://learn.microsoft.com/en-us/style-guide/bias-free-communication
- https://www.grammarly.com/
- https://www.grammarly.com/plans
- https://www.grammarly.com/security
- https://www.hemingwayapp.com/
- https://languagetool.org/
- https://vale.sh/docs/
- https://github.com/btford/write-good
- https://github.com/get-alex/alex

---
*Feature research for: privacy-first technical writing assistant as a standalone static website*
*Researched: 2026-03-08*
