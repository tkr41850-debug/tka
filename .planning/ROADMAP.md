# Roadmap: Technical Writing Assistant

## Overview

This roadmap turns the narrowed boundary into seven dependency-aware phases: establish a fast static single-text workspace, make browser-local analysis responsive, surface trustworthy findings, then add contextual guidance, rule tuning, accessible trust features, and durable local continuity. Optional WASM stays out of v1 and is only reconsidered after profiling shows the worker-based JavaScript path is no longer enough.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Local Workspace Foundation** - Fast static shell for one local text source and no-cloud analysis entry. (completed 2026-03-09)
- [x] **Phase 2: Responsive Analysis Loop** - Background browser-local analysis refreshes without blocking writing. (completed 2026-03-10)
- [ ] **Phase 3: Core Findings** - Initial rule pack returns prioritized technical-writing issues.
- [ ] **Phase 4: Contextual Review and Guidance** - Findings become explorable in place with explanations and safe edits.
- [ ] **Phase 5: Rule Tuning and Custom Detection** - Users can tailor rules, thresholds, and banned phrases.
- [ ] **Phase 6: Trustworthy First-Run Access** - Tutorial, accessibility, and per-warning dismissals make the app usable and trustworthy.
- [ ] **Phase 7: Local Continuity and Presets** - Same-browser return flows restore preferences, dismissals, presets, and optional draft recovery.

## Phase Details

### Phase 1: Local Workspace Foundation
**Goal**: Users can open a fast static page, work in one text workspace, and analyze text without cloud steps.
**Depends on**: Nothing (first phase)
**Requirements**: WORK-01, WORK-02, PERF-01
**Success Criteria** (what must be TRUE):
  1. User can open the static site and see the app ready to analyze within 3 seconds on supported devices.
  2. User can paste, type, or replace one text source inside a single browser workspace.
  3. User can start analysis of the current text without accounts, uploads, or any step that sends text off the website.
**Plans**: 2 plans
Plans:
- [x] `01-01-PLAN.md` - Scaffold the static React shell, shared styling, and fast test/build pipeline.
- [x] `01-02-PLAN.md` - Build the single-text workspace and browser-local analysis entry flow.

### Phase 2: Responsive Analysis Loop
**Goal**: Users can keep writing while local analysis refreshes in the background.
**Depends on**: Phase 1
**Requirements**: WORK-03, WORK-04, PERF-02
**Success Criteria** (what must be TRUE):
  1. User can continue editing while analysis runs without the text workspace freezing.
  2. User sees refreshed analysis shortly after pausing typing on typical documents.
  3. User can change text and trigger a fresh analysis without reloading the page or losing the current draft.
**Plans**: 2 plans
Plans:
- [x] `02-01-PLAN.md` - Build the background worker protocol, client, and debounced scheduler for local analysis.
- [x] `02-02-PLAN.md` - Integrate automatic refresh, live analysis states, and end-to-end verification into the workspace UI.

### Phase 3: Core Findings
**Goal**: Users can receive a trustworthy first pass of prioritized technical-writing findings.
**Depends on**: Phase 2
**Requirements**: REVW-02, CLAR-01, CLAR-02, CLAR-03, CLAR-04, CLAR-06
**Success Criteria** (what must be TRUE):
  1. User sees a prioritized issue list that includes severity, rule name, and text location for each detected finding.
  2. User sees overly long sentences and overly long paragraphs flagged using the app's active default limits.
  3. User sees likely passive-voice and tense-drift warnings when the current draft departs from the app's default guidance.
  4. User sees wordy or filler phrasing flagged as clarity issues in the prioritized review list.
**Plans**: TBD

### Phase 4: Contextual Review and Guidance
**Goal**: Users can inspect each finding in context and act on supported guidance safely.
**Depends on**: Phase 3
**Requirements**: REVW-01, REVW-03, GUID-01, GUID-02, GUID-03, CLAR-05
**Success Criteria** (what must be TRUE):
  1. User sees inline highlights or underlines on the exact text spans tied to detected issues.
  2. User can move from an issue-list entry to the matching text and back without losing context.
  3. User can open a warning and understand why it fired through a short explanation.
  4. User sees targeted rewrite suggestions or examples for supported rules, including simpler alternatives for jargon or overly complex wording when available.
  5. User can apply a safe suggested rewrite and undo that change.
**Plans**: TBD

### Phase 5: Rule Tuning and Custom Detection
**Goal**: Users can tune what the analyzer checks and what counts as a violation for their writing style.
**Depends on**: Phase 4
**Requirements**: RULE-01, RULE-02, RULE-03, CLAR-07
**Success Criteria** (what must be TRUE):
  1. User can enable or disable each available rule individually and see refreshed analysis respect those choices.
  2. User can change supported numeric thresholds, such as sentence and paragraph length, and see findings update to match.
  3. User can add custom banned phrases and see those phrases detected in the current text.
**Plans**: TBD

### Phase 6: Trustworthy First-Run Access
**Goal**: Users can trust and operate the review experience accessibly from their first visit.
**Depends on**: Phase 4, Phase 5
**Requirements**: REVW-04, A11Y-01, A11Y-02
**Success Criteria** (what must be TRUE):
  1. User can complete or skip a brief first-run tutorial that introduces highlights, the issue list, and rule settings in under one minute.
  2. User can review warnings, settings, and suggestions with keyboard access, assistive announcements, and non-color-only severity cues.
  3. User can dismiss an individual warning in the current text without disabling the rule that found it.
**Plans**: TBD

### Phase 7: Local Continuity and Presets
**Goal**: Users can come back on the same browser and resume their local workflow with saved preferences.
**Depends on**: Phase 5, Phase 6
**Requirements**: RULE-04, SAVE-01, SAVE-02
**Success Criteria** (what must be TRUE):
  1. User can save and load local rule presets on the same device.
  2. User sees rule settings, dismissals, and presets restored between visits on the same browser without creating an account.
  3. User can restore the last local draft or session on the same browser when local recovery is enabled.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Local Workspace Foundation | 2/2 | Complete | 2026-03-09 |
| 2. Responsive Analysis Loop | 2/2 | Complete | 2026-03-10 |
| 3. Core Findings | 0/TBD | Not started | - |
| 4. Contextual Review and Guidance | 0/TBD | Not started | - |
| 5. Rule Tuning and Custom Detection | 0/TBD | Not started | - |
| 6. Trustworthy First-Run Access | 0/TBD | Not started | - |
| 7. Local Continuity and Presets | 0/TBD | Not started | - |
