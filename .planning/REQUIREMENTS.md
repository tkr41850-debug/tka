# Requirements: Technical Writing Assistant

**Defined:** 2026-03-08
**Core Value:** Users can paste or type text into a single web page and immediately get useful, local-only feedback that helps them write more clearly.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Workspace

- [ ] **WORK-01**: User can paste, type, or replace one text source in a single browser workspace.
- [ ] **WORK-02**: User can analyze the current text without the app sending that text off the website.
- [ ] **WORK-03**: User can keep editing while analysis runs in the background.
- [ ] **WORK-04**: User can trigger a fresh analysis after text changes without reloading the page.

### Review

- [ ] **REVW-01**: User can see inline highlights or underlines on the exact text spans that have detected issues.
- [ ] **REVW-02**: User can review detected issues in a prioritized list that shows severity, rule name, and location.
- [ ] **REVW-03**: User can move from an issue-list entry to the matching text and back.
- [ ] **REVW-04**: User can dismiss an individual warning in the current text without disabling the whole rule.

### Guidance

- [ ] **GUID-01**: User can see a short explanation of why each warning triggered.
- [ ] **GUID-02**: User can see targeted rewrite suggestions or examples for supported rules.
- [ ] **GUID-03**: User can apply a safe suggested rewrite and undo that change.

### Rules and Presets

- [ ] **RULE-01**: User can enable or disable each available rule individually.
- [ ] **RULE-02**: User can change numeric thresholds for supported rules such as sentence length and paragraph length.
- [ ] **RULE-03**: User can define custom banned phrases that are checked against the current text.
- [ ] **RULE-04**: User can save and load local rule presets on the same device.

### Clarity and Readability

- [ ] **CLAR-01**: User can detect sentences that exceed a configured maximum word count.
- [ ] **CLAR-02**: User can detect paragraphs that exceed a configured maximum sentence count.
- [ ] **CLAR-03**: User can detect likely passive-voice constructions.
- [ ] **CLAR-04**: User can detect likely tense drift away from the configured tense guidance.
- [ ] **CLAR-05**: User can detect jargon or overly complex wording and see simpler alternatives when available.
- [ ] **CLAR-06**: User can detect wordy or filler phrasing supported by the local rule pack.
- [ ] **CLAR-07**: User can detect occurrences of custom banned phrases.

### Local Persistence

- [ ] **SAVE-01**: User can keep rule settings, dismissals, and presets between visits on the same browser without creating an account.
- [ ] **SAVE-02**: User can restore the last local draft or session on the same browser when local recovery is enabled.

### Onboarding and Accessibility

- [ ] **A11Y-01**: User can complete or skip a brief first-run tutorial that introduces highlights, the issue list, and rule settings in under one minute.
- [ ] **A11Y-02**: User can review warnings, settings, and suggestions with keyboard access, assistive announcements, and non-color-only severity cues.

### Responsiveness

- [ ] **PERF-01**: User sees the app ready to analyze within 3 seconds on supported devices.
- [ ] **PERF-02**: User sees analysis refresh shortly after pausing typing on typical documents.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Additional Analysis

- **LANG-01**: User can enable additional local grammar and punctuation checks beyond the core clarity rule pack.
- **READ-01**: User can see syllable counts and richer readability metrics for flagged passages.
- **SUMM-01**: User can generate a local document overview for the current text when a trustworthy local approach is validated.

### Specialized Modes

- **MAIL-01**: User can enable a plain-text email guidance mode for greetings, context, and closings.
- **PRES-01**: User can import and export local rule presets as files for reuse across devices.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Word, Google Docs, Gmail, Outlook, or PowerPoint integrations | Conflicts with the standalone static-website boundary and one-source browser workflow |
| Accounts, Google login, university-email login, cloud sync, or collaboration | Requires backend services and violates the local-only product promise |
| Presentation checks such as font-size, slide contrast, or background-color analysis | The narrowed domain is text-only, not slide or visual review |
| Remote bug reporting, telemetry, or crash uploads | Requires sending usage or content off-device, which conflicts with the privacy-first scope |
| Cloud AI rewriting, remote grammar APIs, or server-side text analysis | All text processing must stay on the static website in the browser |
| Non-English analysis or translation | English-only scope for this project |
| OCR, audio/video analysis, social media integration, website content integration, plagiarism checking, or fact checking | Outside the single-source text-analysis product boundary |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WORK-01 | Phase 1 | Pending |
| WORK-02 | Phase 1 | Pending |
| WORK-03 | Phase 2 | Pending |
| WORK-04 | Phase 2 | Pending |
| REVW-01 | Phase 4 | Pending |
| REVW-02 | Phase 3 | Pending |
| REVW-03 | Phase 4 | Pending |
| REVW-04 | Phase 6 | Pending |
| GUID-01 | Phase 4 | Pending |
| GUID-02 | Phase 4 | Pending |
| GUID-03 | Phase 4 | Pending |
| RULE-01 | Phase 5 | Pending |
| RULE-02 | Phase 5 | Pending |
| RULE-03 | Phase 5 | Pending |
| RULE-04 | Phase 7 | Pending |
| CLAR-01 | Phase 3 | Pending |
| CLAR-02 | Phase 3 | Pending |
| CLAR-03 | Phase 3 | Pending |
| CLAR-04 | Phase 3 | Pending |
| CLAR-05 | Phase 4 | Pending |
| CLAR-06 | Phase 3 | Pending |
| CLAR-07 | Phase 5 | Pending |
| SAVE-01 | Phase 7 | Pending |
| SAVE-02 | Phase 7 | Pending |
| A11Y-01 | Phase 6 | Pending |
| A11Y-02 | Phase 6 | Pending |
| PERF-01 | Phase 1 | Pending |
| PERF-02 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-08 after roadmap creation*
