# Phase 3: Core Findings - Research

**Researched:** 2026-03-10
**Domain:** Browser-local rule detection, prioritized findings, and trustworthy heuristic warnings for technical writing
**Confidence:** MEDIUM-HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REVW-02 | User can review detected issues in a prioritized list that shows severity, rule name, and location. | Use a typed finding model with severity, rule metadata, stable sorting, and sentence/paragraph anchors so the UI can render one ordered review list. |
| CLAR-01 | User can detect sentences that exceed a configured maximum word count. | Reuse the current local text parsing path, add sentence spans plus per-sentence word counts, and emit findings when a sentence crosses the default limit. |
| CLAR-02 | User can detect paragraphs that exceed a configured maximum sentence count. | Build paragraph spans from the existing blank-line split logic and count normalized sentences per paragraph before generating findings. |
| CLAR-03 | User can detect likely passive-voice constructions. | Ship a conservative heuristic that looks for be-verbs plus likely participles and labels matches as `likely passive voice` instead of claiming certainty. |
| CLAR-04 | User can detect likely tense drift away from the configured tense guidance. | Start with present-tense guidance and flag obvious past/future markers only when they depart from the selected default so false positives stay manageable. |
| CLAR-06 | User can detect wordy or filler phrasing supported by the local rule pack. | Curate a small local phrase list with explicit replacements and match phrases case-insensitively with exact text spans. |
</phase_requirements>

## Summary

Phase 3 should keep the current worker-backed analysis loop intact and replace the lightweight snapshot-only output with a richer `DraftAnalysis` result that still stays fully browser-local. The best fit for this repo is a small heuristic rule engine: parse the current draft into sentence and paragraph spans, run deterministic rule detectors over those spans, and return a normalized finding list that the UI can sort by severity and render immediately.

The key product constraint is trust. Long sentences, long paragraphs, and curated filler phrases are deterministic and should be treated as high-confidence clarity findings. Passive voice and tense drift are fuzzier, so the app should present them as likely warnings with conservative matching and explanatory copy. Google's developer style guidance recommends active voice and present tense for technical documentation, which gives the phase a practical default target without introducing user-configurable tuning yet.

The current Phase 2 architecture is already the right delivery path. `App.tsx` owns one authoritative draft, the worker already returns typed analysis results, and the UI already distinguishes queued versus fresh output. Phase 3 should extend that pipeline rather than fork it: keep analysis pure inside local helpers, run the full rule pack in the worker, and let the main thread render stable findings alongside the existing snapshot metrics.

**Primary recommendation:** Introduce a typed finding model plus deterministic detector modules in `src/features/analysis/`, keep heuristic rules conservative and explicitly labeled, and wire the worker result into a prioritized findings panel with focused unit and integration coverage.

## Standard Stack

### Core
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| Typed local detector modules | repo-local | Run sentence, paragraph, passive, tense, and filler checks | Fits the current dependency-light browser-only architecture and keeps rule logic testable. |
| Existing dedicated Web Worker | browser-native | Run heavier detection off the typing thread | Reuses the Phase 2 architecture so richer analysis still does not block editing. |
| Plain regex/string heuristics | repo-local | Detect passive voice, tense markers, and filler phrases | Good enough for an English-only v1 first pass without adding a heavy NLP dependency. |
| React list rendering | React 19.2.4 | Show prioritized findings with severity and location | Matches the current app shell and existing integration-test patterns. |

### Supporting
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| Existing snapshot helpers | repo-local | Reuse word, sentence, and paragraph normalization patterns | Use as the base for span-aware parsing so metrics and findings stay consistent. |
| Vitest | 4.0.18 | Unit-test deterministic detectors and prioritization | Use for rule-by-rule fixtures and ranking edge cases. |
| React Testing Library | 16.3.2 | Verify the user-visible findings list and stale/fresh behavior | Use for end-to-end checks of rendered findings after worker responses. |
| `Intl.Segmenter` (optional future enhancement) | browser-native | More locale-aware segmentation | Keep as a future option only; current v1 remains English-only and should avoid raising browser-support risk now. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local heuristics now | Full NLP library or WASM grammar engine | Better language modeling, but too much bundle and maintenance cost for the first warning pack. |
| Conservative passive/tense detection | Aggressive grammar inference | Finds more candidates but risks undermining trust with noisy warnings. |
| Reuse current worker result path | Main-thread rule execution | Simpler wiring, but it wastes the Phase 2 architecture and risks typing regressions as checks grow. |
| Small local phrase list | Remote style API or cloud grammar service | Violates the no-cloud product boundary. |

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── features/analysis/
│   ├── lib/
│   │   ├── analyzeDraft.ts           # single entry for rule execution
│   │   ├── parseDraft.ts             # sentence/paragraph spans and metrics
│   │   └── findings/
│   │      ├── detectLengthIssues.ts
│   │      ├── detectWordiness.ts
│   │      └── detectVoiceAndTense.ts
│   └── types.ts                      # DraftAnalysis, Finding, and rule metadata
├── features/workspace/components/
│   └── WorkspaceSnapshot.tsx         # metrics + prioritized findings list
└── App.tsx                           # unchanged orchestration surface
```

### Pattern 1: Parse once, detect many times
**What:** Build one normalized draft parse with sentence spans, paragraph spans, and word counts, then run every rule over that shared structure.
**When to use:** Immediately, because multiple Phase 3 rules depend on the same boundaries and locations.
**Why:** Prevents each detector from inventing its own text slicing rules and drifting on counts or offsets.

### Pattern 2: Confidence-aware findings
**What:** Distinguish deterministic findings from heuristic findings through severity plus explanation copy.
**When to use:** Especially for passive voice and tense drift, where the app should say `likely` and explain the heuristic trigger.
**Why:** The phase goal is a trustworthy first pass, not a perfect grammar engine.

### Pattern 3: Stable prioritization at the analysis boundary
**What:** Sort findings before they leave the worker by severity, then by rule priority, then by earliest text location.
**When to use:** In the main `analyzeDraft` entry so every UI state gets a stable order without duplicating sorting logic in React.
**Why:** `REVW-02` depends on one consistent prioritized list, and deterministic ordering keeps tests simple.

### Anti-Patterns to Avoid
- Do not bolt warning detection directly into `WorkspaceSnapshot.tsx`; keep the UI dumb and the analysis pure.
- Do not claim passive voice or tense drift with certainty; label them as likely heuristic findings.
- Do not add configurable rule settings yet; Phase 5 owns user tuning and custom thresholds.
- Do not replace the existing local snapshot metrics; findings should extend the current analysis, not remove earlier trust cues.

## Detection Guidance

### Default limits and heuristics
- **Sentence length:** Start with 28 words per sentence as the default long-sentence threshold.
- **Paragraph length:** Start with 6 sentences per paragraph as the default long-paragraph threshold.
- **Preferred tense:** Default to present tense for technical guidance and reference-like writing.
- **Passive voice heuristic:** Match common be-verbs followed by likely participles; boost confidence when a `by` phrase is present.
- **Wordiness pack:** Start with a small fixed phrase list such as `in order to`, `please note`, `simply`, `just`, `at this point in time`, and `due to the fact that`.

### Location model
- Every finding should include:
  - rule id and rule label
  - severity
  - start/end offsets in the full draft
  - sentence number or paragraph number for display
  - matched text excerpt
  - explanation copy and optional suggested replacement

This keeps Phase 4 free to add inline highlights using the same stored spans.

## Common Pitfalls

### Pitfall 1: Inconsistent sentence boundaries across rules
**What goes wrong:** Long-sentence counts, tense checks, and location labels disagree about where a sentence starts or ends.
**How to avoid:** Centralize parsing and share one sentence array across all detectors.

### Pitfall 2: Passive-voice over-reporting
**What goes wrong:** Past-tense or adjectival phrases are flagged as passive voice and erode trust.
**How to avoid:** Keep the heuristic narrow, mark matches as likely, and cover known false-positive fixtures in tests.

### Pitfall 3: Tense drift without a clear baseline
**What goes wrong:** The app flags any past or future verb, even when the sentence is intentionally historical or procedural.
**How to avoid:** Start from one explicit default guidance value and flag only obvious departures, not every tense variation in English.

### Pitfall 4: UI ranking logic duplicates analysis ranking logic
**What goes wrong:** The worker returns findings in one order while React re-sorts them differently.
**How to avoid:** Make `analyzeDraft` return the final prioritized order and treat the UI as a pure renderer.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + React Testing Library |
| Config file | `vite.config.ts` |
| Quick run command | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts src/features/analysis/lib/findings/detectVoiceAndTense.test.ts src/App.test.tsx` |
| Full suite command | `npm run test -- --run && npm run build` |
| Estimated runtime | ~12 seconds |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REVW-02 | Findings render in a prioritized list with severity, rule, and location | component | `npm run test -- --run src/App.test.tsx` | ✅ `src/App.test.tsx` exists |
| CLAR-01 | Long sentences are flagged from default word-count limits | unit | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts` | ❌ Wave 1 creates |
| CLAR-02 | Long paragraphs are flagged from default sentence-count limits | unit | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts` | ❌ Wave 1 creates |
| CLAR-03 | Likely passive voice is flagged conservatively | unit | `npm run test -- --run src/features/analysis/lib/findings/detectVoiceAndTense.test.ts` | ❌ Wave 2 creates |
| CLAR-04 | Likely tense drift is flagged against present-tense guidance | unit | `npm run test -- --run src/features/analysis/lib/findings/detectVoiceAndTense.test.ts` | ❌ Wave 2 creates |
| CLAR-06 | Curated filler phrases are flagged as clarity issues | unit | `npm run test -- --run src/features/analysis/lib/analyzeDraft.test.ts` | ❌ Wave 1 creates |

### Nyquist Sampling Rate
- **After every task commit:** Run that task's targeted `npm run test -- --run ...` command or `npm run build` for type-shape changes.
- **After every plan wave:** Run `npm run test -- --run && npm run build`.
- **Phase-complete gate:** The full suite plus build must pass before verification.
- **Estimated feedback latency per task:** ~12 seconds.

### Wave 0 Gaps (must be created before later implementation depends on them)
- [ ] `src/features/analysis/lib/analyzeDraft.test.ts` - end-to-end rule-engine coverage for deterministic findings and ordering
- [ ] `src/features/analysis/lib/findings/detectVoiceAndTense.test.ts` - passive voice and tense drift fixture coverage

## Sources

### Primary (HIGH confidence)
- `https://developers.google.com/style/voice` - active-voice guidance for technical writing and the rationale for treating passive voice as a likely warning, not an absolute error
- `https://developers.google.com/style/tense` - present-tense guidance that supports a Phase 3 default tense target
- `https://developers.google.com/style/word-list` - examples of clarity-oriented wording guidance and jargon reduction principles for the initial filler phrase pack

### Secondary (MEDIUM confidence)
- `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter` - confirmed `Intl.Segmenter` is now broadly available, but still optional for this English-only v1 implementation
- Existing repo code in `src/App.tsx`, `src/features/workspace/lib/createLocalSnapshot.ts`, and `src/features/analysis/types.ts` - confirmed the worker pipeline and current parsing helpers are the right extension points
- Existing Phase 1 and Phase 2 summaries - confirmed the current single-draft workflow, trust-copy approach, and worker-driven architecture

## Metadata

**Confidence breakdown:**
- Deterministic long-sentence, long-paragraph, and filler detection: HIGH
- Passive voice heuristic: MEDIUM
- Tense-drift heuristic: MEDIUM
- UI integration on top of Phase 2 worker flow: HIGH

**Research date:** 2026-03-10
**Valid until:** 2026-04-09
