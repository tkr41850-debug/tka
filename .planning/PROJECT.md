# Technical Writing Assistant

## What This Is

Technical Writing Assistant is a browser-based writing and presentation review tool for professionals, educators, and students who need clearer communication with less manual proofreading. It checks documents, email drafts, and slide content for readability, tone, accessibility, and formatting issues, then surfaces actionable suggestions inside a static web experience.

The project starts from `FinalSpecDraft.md`, but the implementation is constrained to a static website delivery model rather than a browser extension or native desktop product. That means the product should preserve the spirit of the spec while adapting workflows to browser-friendly input methods such as typing, paste, upload, and client-side analysis.

## Core Value

Users can quickly catch and fix communication and presentation problems before they send an email, publish a document, or present a slide deck.

## Requirements

### Validated

(None yet -- ship to validate)

### Active

- [ ] Analyze writing for sentence length, paragraph length, passive voice, tense, readability, and writing-rule violations.
- [ ] Analyze presentation content for readability and accessibility issues such as font size and color contrast.
- [ ] Show clear warnings, explanations, and suggested fixes that users can dismiss, accept, or revisit.
- [ ] Let users configure rules, toggle checks on or off, and save or reload their preferred rule sets.
- [ ] Support browser-based workflows for documents, email drafts, and presentation content without requiring installed software.
- [ ] Provide onboarding, account access, and lightweight feedback or bug-report flows that fit a static-web architecture.

### Out of Scope

- Non-English language support -- the source spec explicitly limits the product to English.
- Translation, audio/video analysis, OCR, plagiarism detection, sentence autocomplete, and fact checking -- explicitly excluded in the source spec.
- Collaboration features, social media integration, and website content integration -- excluded to keep v1 focused on individual review workflows.
- Native Microsoft Word, Outlook, Gmail, Google Docs, or PowerPoint integrations in v1 -- the user constrained the product to a static website delivery model.

## Context

The source vision comes from `FinalSpecDraft.md`, a detailed requirements draft centered on three main user archetypes: an educator who needs clearer teaching materials, a product manager with dyslexia and color-vision limitations who needs more readable documents and slides, and a software engineer who needs help writing more professional emails. Across those personas, the recurring problem is the same: people are busy, communication quality slips under time pressure, and existing tools do not give enough targeted help for clarity, accessibility, and professionalism.

The spec calls for a broad assistant that spans text quality checks, slide readability checks, configurable rules, dismissible warnings, tutorial onboarding, document overviews, email enhancement, and feedback loops. It also assumes integrations with common writing tools, but this implementation needs to reinterpret those capabilities for a static-web product, likely by focusing on direct browser input, uploaded content, and client-side processing with optional WASM support where performance helps.

## Constraints

- **Platform**: Static website only (HTML/CSS/JavaScript, optional WASM) -- explicitly requested by the user.
- **Architecture**: Prefer client-side or static-host-compatible services -- the app must run from static hosting without a custom always-on server runtime.
- **Source Scope**: Implement most of `FinalSpecDraft.md` -- the draft is the primary feature and behavior source.
- **Language**: English only -- matches the source spec's stated boundary.
- **Accessibility**: Must account for readability and visual-accessibility needs -- central to the personas and product value.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build as a static web app | User explicitly limited delivery to a static website, with optional WASM for heavier processing | -- Pending |
| Use `FinalSpecDraft.md` as the primary product brief | Auto mode needs a source document, and this file contains the most complete project definition in the workspace | -- Pending |
| Adapt editor integrations into browser-native workflows | The original spec assumes deep integrations, but static hosting requires browser-friendly alternatives | -- Pending |

---
*Last updated: 2026-03-08 after initialization*
