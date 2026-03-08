# Stack Research

**Domain:** Privacy-first local-only technical writing assistant as a standalone static web app
**Researched:** 2026-03-08
**Confidence:** HIGH

Build this as a single-page React app with Vite and TypeScript, a CodeMirror 6 plain-text editor, a worker-isolated analysis engine, and IndexedDB persistence. That is the current standard stack that actually matches the constraints here: static hosting only, client-side processing only, one text source, English-only text analysis, and optional Wasm without sneaking in backend assumptions.

Do not add a router, server framework, collaboration layer, or cloud NLP service in v1. Keep the product as one page with local state, local persistence, and an analysis pipeline that starts in TypeScript and only moves specific hot paths to Wasm after profiling.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.2.x | UI framework | Still the safest standard choice for a greenfield browser app: mature ecosystem, strong hiring pool, and easy composition of editor, diagnostics panel, rule controls, and onboarding flow in a purely client-side app. |
| Vite + `@vitejs/plugin-react` | 7.3.x / 5.1.x | Build tool, dev server, production bundling | Best fit for static-only deployment. Vite outputs plain `dist/` assets, supports workers directly, and supports loading `.wasm` files via `?init` or `?url` without introducing SSR or server runtime baggage. |
| TypeScript | 5.9.x | Type safety across rules, diagnostics, storage, and worker boundaries | This product is rule-heavy and schema-heavy, so TypeScript pays for itself quickly. TS 5.9 also aligns well with modern ESM React defaults. |
| CodeMirror 6 | `@codemirror/view` 6.39.x | Plain-text editor with inline warnings, selections, and quick-fix affordances | Better fit than rich-text editors for a one-source text analyzer. CodeMirror's decorations and lint model map directly to range-based diagnostics, highlights, and actions. |
| `unified` + `retext` | 11.0.x / 9.0.x | English prose parsing and rule pipeline | This is the right analysis foundation for technical-writing checks. It is plugin-oriented, browser-capable, and much easier to evolve than a pile of ad hoc regexes once rules start interacting. |
| Web Workers + Comlink | Worker API baseline / `comlink` 4.4.x | Off-main-thread analysis execution | Keeps typing responsive while rules run. Comlink removes most worker boilerplate and lets the UI talk to the analysis engine through a typed async boundary. |
| IndexedDB + `idb` | IndexedDB baseline / `idb` 8.0.x | Local persistence for presets, session recovery, and last working draft | This is the correct browser-native storage layer for structured local data. It handles more data, better structure, and cleaner migrations than `localStorage`. |
| Static hosting target | n/a | Deploy built assets with zero backend runtime | Deploy the Vite `dist/` output to a plain static host. Keep hosting provider-specific features out of the app so the site remains portable across static CDNs. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | 5.0.x | In-memory app state for editor session, filters, panels, and tutorial state | Use for live UI state only. Persist intentionally to IndexedDB instead of auto-persisting the whole store. |
| `@codemirror/lint` | 6.9.x | Diagnostic rendering inside the editor | Use once the rule engine emits structured diagnostics with ranges, messages, severities, and optional actions. |
| Zod | 4.3.x | Runtime validation for persisted presets and worker payloads | Use at storage and worker boundaries so local schema changes fail safely instead of corrupting user data. |
| Vite native Wasm loading (`?init` / `?url`) | 7.3.x | Load optional `.wasm` modules in the app or worker | Use only when a proven hot path needs Wasm. Keep Wasm inside the analysis worker so the UI contract stays stable. |
| `vite-plugin-wasm` | 3.5.x (optional) | Compatibility shim for Wasm toolchains that expect ESM integration behavior Vite does not provide natively | Add only if a real Wasm package forces it. Do not start with this plugin by default. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest 4.0.x | Unit and integration tests for rules, storage adapters, and worker contracts | Best fit with Vite; shares config cleanly and is fast enough for rule-heavy TDD. |
| Playwright 1.58.x | End-to-end tests across Chromium, Firefox, and WebKit | Run against the built static site to verify typing responsiveness, persistence, accessibility, and cross-browser behavior. |
| ESLint 10.0.x + `typescript-eslint` 8.56.x + `eslint-plugin-react-hooks` 7.0.x | Linting for correctness and React safety | Use flat config. Keep linting focused on correctness, hooks, and unsafe async patterns rather than formatting. |
| `tsc --noEmit` | Separate type-check step in CI and pre-merge checks | Vite explicitly recommends type-checking outside the transform pipeline. Use `vite-plugin-checker` only if the team wants type errors surfaced in-browser during dev. |

## Installation

```bash
# Core
npm install react react-dom zustand idb zod unified retext comlink @codemirror/state @codemirror/view @codemirror/lint

# Supporting
npm install @codemirror/commands @codemirror/search

# Dev dependencies
npm install -D vite @vitejs/plugin-react typescript vitest @playwright/test eslint @eslint/js typescript-eslint eslint-plugin-react-hooks
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| React + Vite | Preact + Vite | Use Preact only if bundle size becomes the top priority and the team is comfortable trading some library compatibility for a smaller runtime. |
| CodeMirror 6 | Monaco Editor | Use Monaco only if the product shifts from prose analysis toward a code or Markdown IDE workflow. It is overkill for plain technical-writing diagnostics. |
| IndexedDB + `idb` | `localStorage` | Use `localStorage` only for a tiny boolean or timestamp such as "tutorial dismissed". Do not use it for drafts, presets, or migration-sensitive data. |
| Worker + Comlink analysis engine | Main-thread analysis | Use main-thread analysis only for a throwaway prototype with a handful of cheap O(n) checks. It is the wrong default for a responsive writing assistant. |
| `unified` + `retext` | Regex-only custom rule engine | Use regex-only rules only if the product permanently stays at a tiny set of shallow heuristics. That is unlikely once passive voice, tense, and rewrite guidance interact. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Next.js App Router, Remix loaders/actions, Nuxt server features, or any SSR-first framework | They introduce server/runtime concepts this app does not need and make it too easy to violate the static-only boundary later. | React + Vite SPA with client-only state |
| Firebase, Supabase, Convex, PocketBase, or any hosted DB/auth stack | They add network assumptions, hosted persistence, and account concepts that directly conflict with the local-only privacy requirement. | IndexedDB + `idb` |
| OpenAI, Anthropic, LanguageTool Cloud, or any cloud text-analysis API | They send or depend on user text leaving the browser, which breaks the core privacy promise and the offline/static deployment model. | `unified`/`retext`, browser APIs, and optional local Wasm |
| Tiptap Cloud, Liveblocks, Yjs collaboration stacks, or any collaborative editor service | They solve collaboration/rich-text problems that are explicitly out of scope and usually drag in backend or service dependencies. | CodeMirror 6 plain-text editor |
| `localStorage` as the primary datastore | It is string-only, migration-poor, origin/protocol-sensitive, and not a good home for drafts or structured rule presets. | IndexedDB + `idb`; keep `localStorage` to trivial flags only |

## Stack Patterns by Variant

**If v1 stays rule-based and text-only:**
- Run all analysis in a dedicated module worker using `unified`/`retext` plus custom TypeScript rules.
- Because it ships faster, debugs easier, and already covers sentence, paragraph, phrase, and explanation-style checks.

**If one analysis path becomes a measured bottleneck:**
- Move only that hot path to a small Wasm module and load it inside the existing worker via Vite `?init` or `?url`.
- Because the editor, UI, persistence, and testing architecture stay unchanged while performance improves where it matters.

**If you need a default static host now:**
- Deploy the Vite `dist/` folder to a plain static host such as Cloudflare Pages static hosting or any equivalent CDN-backed static site platform.
- Because the app remains portable static assets and avoids provider lock-in to server functions.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `react@19.2.x` | `typescript@5.9.x`, `@vitejs/plugin-react@5.1.x` | React 19 is stable, and TS 5.9 defaults already assume the modern `react-jsx` path. |
| `vite@7.3.x` | `vitest@4.0.x` | Vitest docs require Vite >= 6; Vite 7 is the current standard choice. |
| `eslint@10.0.x` | `typescript-eslint@8.56.x`, `eslint-plugin-react-hooks@7.0.x` | Use flat config, not legacy `.eslintrc` patterns. |
| `@codemirror/view@6.39.x` | `@codemirror/lint@6.9.x` | Same CM6 modular ecosystem; good pairing for decoration-driven diagnostics. |
| `retext@9.0.x` | `unified@11.0.x` | Keep both on current majors to avoid drifting into stale plugin assumptions. |

## Sources

- `/workspace/.planning/PROJECT.md` — hard product constraints and narrowed scope
- `/workspace/FinalSpecDraft.md` — broader background context, filtered through `PROJECT.md`
- https://react.dev/blog/2024/12/05/react-19 — React 19 stable release
- https://vite.dev/guide/features.html — TypeScript support, worker support, asset handling, and Wasm loading
- https://vite.dev/guide/static-deploy.html — static deployment model and `dist` output guidance
- https://codemirror.net/examples/lint/ — diagnostic model for editor warnings and actions
- https://codemirror.net/examples/decoration/ — decoration model for inline highlighting and widgets
- https://raw.githubusercontent.com/pmndrs/zustand/main/README.md — current Zustand usage patterns and persistence middleware behavior
- https://github.com/jakearchibald/idb — `idb` API, transaction behavior, and typed IndexedDB usage
- https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API — IndexedDB rationale and browser-native storage model
- https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage — `localStorage` limitations and origin/protocol caveats
- https://raw.githubusercontent.com/GoogleChromeLabs/comlink/main/README.md — worker RPC model and transfer behavior
- https://developer.mozilla.org/en-US/docs/Web/API/Worker — worker capabilities and support baseline
- https://developer.mozilla.org/en-US/docs/WebAssembly — WebAssembly capabilities and JS API model
- https://unifiedjs.com/explore/package/retext/ — `retext` role in prose parsing and plugin architecture
- https://vitest.dev/guide/ — Vitest/Vite integration and setup guidance
- https://playwright.dev/docs/intro — Playwright cross-browser E2E testing model
- https://eslint.org/docs/latest/use/getting-started — ESLint 10 flat-config era guidance
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html — TS 5.9 defaults and modern project setup
- npm registry queries on 2026-03-08 via `npm view` — current package versions for React, Vite, TypeScript, CodeMirror, Zustand, `idb`, Zod, Comlink, Vitest, Playwright, ESLint, and related tooling

---
*Stack research for: privacy-first local-only technical writing assistant*
*Researched: 2026-03-08*
