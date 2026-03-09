# Phase 1: Local Workspace Foundation - Research

**Researched:** 2026-03-09
**Domain:** Static-site React workspace foundation for browser-local text analysis
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WORK-01 | User can paste, type, or replace one text source in a single browser workspace. | A React single-page shell with a dedicated workspace component keeps one authoritative text source in client state and exposes explicit replace/clear actions. |
| WORK-02 | User can analyze the current text without the app sending that text off the website. | A browser-local analysis module can run entirely in the same bundle, with no API routes, SDKs, or remote service dependencies. |
| PERF-01 | User sees the app ready to analyze within 3 seconds on supported devices. | Vite's lightweight dev/build pipeline plus a dependency-light React app and plain CSS keep startup fast and compatible with static hosting. |
</phase_requirements>

## Summary

Phase 1 should establish the product as a plain static web app that boots fast, renders a single document workspace immediately, and proves that analysis begins locally in the browser. The most direct fit is a Vite + React + TypeScript SPA: Vite is explicitly optimized for fast local development and production static bundles, while React gives a clean way to isolate the workspace surface, the analysis entry point, and future review panels without introducing server assumptions.

For this phase, the editor surface should stay intentionally simple: use a controlled `textarea` wrapped in a dedicated workspace component rather than introducing a richer editor before inline annotation is needed. That keeps the startup surface light for `PERF-01`, but the component boundary preserves an upgrade path for later phases when exact-span highlighting or richer rewrite interactions may justify a specialized editor.

Testing should start now instead of later. Vitest shares Vite's configuration model, runs on current Node versions, and supports fast jsdom-based UI tests. React Testing Library is the right complement because it verifies what a reader can actually see and do in the workspace rather than asserting implementation details.

**Primary recommendation:** Use Vite 7 + React 19 + TypeScript 5 with plain CSS variables for the UI, a dedicated local snapshot analysis module, and Vitest + React Testing Library for feedback on every task.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vite` | 7.3.1 | Static dev server and production bundler | Official docs position Vite as a fast modern build tool with optimized static production output. |
| `react` | 19.2.4 | Component model for the single-page workspace | React keeps editor state, analysis state, and future review UI isolated without server coupling. |
| `react-dom` | 19.2.4 | Browser rendering entry point | Required for React client rendering in a static SPA. |
| `typescript` | 5.9.3 | Typed workspace and analysis contracts | Useful early because future phases add structured findings, rule settings, and navigation wiring. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vitejs/plugin-react` | 5.1.4 | React support for Vite | Use for JSX transform, Fast Refresh, and Vitest compatibility through shared config. |
| `vitest` | 4.0.18 | Fast automated test runner | Use for quick feedback after every task and for shared config with Vite. |
| `@testing-library/react` | 16.3.2 | DOM-first React component tests | Use for UI behavior checks such as typing, replacing text, and running local analysis. |
| `@testing-library/user-event` | 14.6.1 | User-like interactions in tests | Use to simulate typing, clearing, and clicking the analysis controls. |
| `@testing-library/jest-dom` | 6.9.1 | Readable DOM matchers | Use to keep workspace UI tests concise and behavior-focused. |
| `jsdom` | 28.1.0 | Browser-like test environment | Use as the Vitest environment for component tests. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite + React SPA | Next.js app router | Next.js is powerful, but it brings server-oriented patterns that do not help a strictly static local-only phase. |
| Controlled `textarea` workspace | CodeMirror or Lexical | Rich editors help later with span-level highlights, but they add setup and bundle cost before Phase 1 needs them. |
| Plain CSS variables | Utility CSS framework | A framework can speed styling, but plain CSS keeps the initial bundle smaller and makes the visual direction easier to control. |

**Installation:**
```bash
npm install react react-dom && npm install -D vite @vitejs/plugin-react typescript vitest jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom @types/react @types/react-dom
```

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── features/workspace/   # Editor surface, sample draft, local analysis helpers
├── lib/                  # Small app-level utilities like boot timing
├── test/                 # Shared test setup
├── App.tsx               # Shell composition and state orchestration
└── main.tsx              # Browser entry point
```

### Pattern 1: Thin app shell, feature-owned workspace logic
**What:** Keep `App.tsx` responsible for orchestration while workspace-specific rendering and text utilities live under `src/features/workspace/`.
**When to use:** Immediately in Phase 1, so later phases can add findings, rule settings, and issue navigation without turning `App.tsx` into a catch-all file.
**Example:**
```typescript
import { useState } from 'react';
import { WorkspaceEditor } from './features/workspace/components/WorkspaceEditor';
import { createLocalSnapshot } from './features/workspace/lib/createLocalSnapshot';

export function AppShell() {
  const [draft, setDraft] = useState('');
  const [snapshot, setSnapshot] = useState(() => createLocalSnapshot(''));

  return (
    <WorkspaceEditor
      value={draft}
      onChange={setDraft}
      onAnalyze={() => setSnapshot(createLocalSnapshot(draft))}
    />
  );
}
```

### Pattern 2: Editor-agnostic analysis contract
**What:** Keep analysis logic as a pure function that accepts text and returns a typed snapshot object.
**When to use:** Use now for the Phase 1 local snapshot and keep the same contract shape when later phases add findings, severities, and rewrites.
**Example:**
```typescript
export type LocalSnapshot = {
  words: number;
  sentences: number;
  paragraphs: number;
};

export function createLocalSnapshot(text: string): LocalSnapshot {
  return {
    words: countWords(text),
    sentences: countSentences(text),
    paragraphs: countParagraphs(text),
  };
}
```

### Pattern 3: Shared Vite + Vitest config
**What:** Put the Vitest `test` block in `vite.config.ts` so the app and tests resolve modules the same way.
**When to use:** Right away, because this repo starts without any app tooling and Phase 1 needs feedback loops with minimal config drift.
**Example:**
```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
});
```

### Anti-Patterns to Avoid
- **Server-shaped foundation:** Do not add API routes, server actions, or telemetry hooks in a phase whose main promise is local-only analysis.
- **Overpowered editor too early:** Do not pay a bundle and complexity tax for rich text plumbing before inline review actually needs it.
- **Anonymous global state:** Do not scatter text state across unrelated modules; keep one authoritative workspace source in React state.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Static build pipeline | Custom bundler scripts | Vite | Vite already solves fast dev server, optimized build output, and plugin integration. |
| React DOM test harness | Homemade render utilities | React Testing Library | It keeps tests aligned with visible user behavior and accessibility semantics. |
| Test runner wiring | Ad hoc Node scripts | Vitest | It integrates directly with Vite and supports fast jsdom-based feedback. |
| Word/sentence/paragraph baseline metrics | Remote API or service call | Local pure functions | Phase 1 only needs browser-local analysis entry, so network calls would violate the product boundary. |

**Key insight:** The risk in this phase is not algorithmic complexity; it is accidentally introducing server assumptions or heavy dependencies before the product earns them.

## Common Pitfalls

### Pitfall 1: Accidentally breaking the privacy promise
**What goes wrong:** The app starts with analytics, remote fonts, cloud SDKs, or server endpoints that contradict the local-only positioning.
**Why it happens:** Default frontend setup habits often add hosted services immediately.
**How to avoid:** Keep Phase 1 browser-only, dependency-light, and explicit in the UI about local processing.
**Warning signs:** New environment variables, fetch calls, SDK packages, or telemetry config files appear during foundation work.

### Pitfall 2: Coupling the workspace to future analysis complexity
**What goes wrong:** The initial editor is built around upcoming rules, making a simple single-source workspace harder to reason about.
**Why it happens:** Planning for future features can turn Phase 1 into a premature platform build.
**How to avoid:** Create a simple workspace component and a pure snapshot function with stable typed outputs.
**Warning signs:** The editor component needs multiple providers, decorators, or plugin systems before any findings exist.

### Pitfall 3: Weak test ergonomics from split config
**What goes wrong:** The app builds, but tests drift because they do not share the same aliases, plugins, or environment setup.
**Why it happens:** Separate build and test config files get out of sync in new projects.
**How to avoid:** Configure Vitest in `vite.config.ts` unless a later phase proves that a separate config is necessary.
**Warning signs:** Tests need special import workarounds that the app itself does not.

### Pitfall 4: Generic starter UI lingering too long
**What goes wrong:** The default scaffold ships with placeholder layout and makes Phase 1 feel unfinished even if the architecture is sound.
**Why it happens:** Foundation work often stops after tooling succeeds.
**How to avoid:** Replace the starter shell immediately with a product-shaped landing view and clear local-only status copy.
**Warning signs:** Default logos, boilerplate counters, or framework-branded copy survive after the first implementation task.

## Code Examples

Verified patterns from official sources and product constraints:

### Root static entry
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### DOM-first interaction test
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('runs a local snapshot for the current draft', async () => {
  const user = userEvent.setup();

  render(<App />);

  await user.clear(screen.getByLabelText(/single document workspace/i));
  await user.type(screen.getByLabelText(/single document workspace/i), 'Ship the release today.');
  await user.click(screen.getByRole('button', { name: /run local snapshot/i }));

  expect(screen.getByText(/4 words across 1 sentence and 1 paragraph/i)).toBeInTheDocument();
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Heavy framework-specific CLIs for every frontend foundation | Vite-centered SPA tooling with fast HMR and optimized static output | Current official Vite guidance (v7 docs) | Better fit for a fast static product with minimal ceremony. |
| Separate unit test runners disconnected from the build tool | Vitest sharing Vite configuration | Current official Vitest guidance | Lower config drift and faster test startup for a new frontend repo. |

**Deprecated/outdated:**
- Hand-built bundler chains for a small static SPA are unnecessary here; Vite already covers the needed build and preview flow.
- A default starter page is acceptable for scaffolding only, not for the shipped Phase 1 product surface.

## Open Questions

1. **When should the workspace move beyond a `textarea`?**
   - What we know: Phase 4 needs exact text-span review and safe rewrites.
   - What's unclear: Whether native selection and overlays will be enough or whether a richer text engine is warranted.
   - Recommendation: Keep Phase 1 editor-agnostic by isolating the workspace component and analysis contract, then revisit in Phase 3 or 4 with real annotation requirements.

2. **How much performance telemetry should the UI expose?**
   - What we know: `PERF-01` needs a quick readiness signal, but the app must stay local-only and lightweight.
   - What's unclear: Whether future phases need richer timing instrumentation.
   - Recommendation: Show a simple local ready-time indicator in Phase 1 and defer deeper profiling hooks until Phase 2 background analysis work exists.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + React Testing Library |
| Config file | `vite.config.ts` |
| Quick run command | `npm run test -- --run src/App.test.tsx src/features/workspace/lib/createLocalSnapshot.test.ts` |
| Full suite command | `npm run test -- --run && npm run build` |
| Estimated runtime | ~10 seconds |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WORK-01 | User can type, clear, and replace the current draft in one workspace | component | `npm run test -- --run src/App.test.tsx` | ❌ Wave 1 task creates it |
| WORK-02 | User can run analysis without a network hop and see local results | component + unit | `npm run test -- --run src/App.test.tsx src/features/workspace/lib/createLocalSnapshot.test.ts` | ❌ Wave 1/2 tasks create them |
| PERF-01 | App shell renders and production build succeeds quickly from a static bundle | smoke | `npm run test -- --run src/App.test.tsx && npm run build` | ❌ Wave 1 task creates it |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task -> run: `npm run test -- --run` or the narrower file-level command listed in the plan.
- **Full suite trigger:** Before closing the last task in each plan wave.
- **Phase-complete gate:** `npm run test -- --run && npm run build` must pass before verification.
- **Estimated feedback latency per task:** ~10 seconds.

### Wave 0 Gaps (must be created before implementation)
- [ ] `src/test/setup.ts` - shared matcher bootstrap for component tests
- [ ] `src/App.test.tsx` - smoke coverage for shell readiness and workspace flow
- [ ] `src/features/workspace/lib/createLocalSnapshot.test.ts` - unit coverage for local snapshot math

## Sources

### Primary (HIGH confidence)
- `https://vite.dev/guide/` - verified Vite 7 static app guidance, Node support, and default scripts
- `https://vitest.dev/guide/` - verified Vitest 4 setup, Vite config sharing, and `vitest run` usage
- `https://react.dev/learn` - verified current React component/state patterns for client UI composition
- `https://testing-library.com/docs/react-testing-library/intro/` - verified React Testing Library installation and DOM-first testing guidance

### Secondary (MEDIUM confidence)
- `npm view react version` - current published React package version
- `npm view react-dom version` - current published React DOM package version
- `npm view vite version` - current published Vite package version
- `npm view vitest version` - current published Vitest package version

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - official docs and current package metadata align cleanly
- Architecture: HIGH - directly derived from project constraints and the chosen stack's standard patterns
- Pitfalls: HIGH - all are consistent with the product boundary and early-phase frontend tradeoffs

**Research date:** 2026-03-09
**Valid until:** 2026-04-08
