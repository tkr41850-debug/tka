# Phase 2: Responsive Analysis Loop - Research

**Researched:** 2026-03-09
**Domain:** Debounced browser-local analysis with a dedicated worker and latest-result-wins UI state
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WORK-03 | User can keep editing while analysis runs in the background. | A dedicated Web Worker moves analysis off the main thread so typing stays responsive while the current draft is processed. |
| WORK-04 | User can trigger a fresh analysis after text changes without reloading the page. | A main-thread scheduler can debounce draft edits, queue new runs, and expose an immediate refresh path without resetting app state. |
| PERF-02 | User sees analysis refresh shortly after pausing typing on typical documents. | A configurable debounce window around 300 ms plus latest-result-wins message handling keeps refreshes quick without rerunning analysis on every keystroke. |
</phase_requirements>

## Summary

Phase 2 should turn the current button-driven snapshot into a continuous background loop that never steals focus from writing. The cleanest path is to keep `createLocalSnapshot` as the analysis core, move its execution behind a dedicated Web Worker, and add a small main-thread scheduler that debounces draft edits before dispatching the newest text to the worker. That matches the product boundary: still browser-local, still dependency-light, and now ready for heavier Phase 3 rule logic without redesigning the app surface.

The key design choice is to make the worker boundary stable now instead of waiting for the rule pack to get slow enough to force a refactor. MDN documents that dedicated workers run scripts in background threads and communicate through `postMessage()`, while Vite recommends `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })` for bundler-safe worker loading. That combination gives the app a standards-based background execution model with no new runtime dependency.

The main thread should remain responsible for trust and timing: track whether results are `queued`, `running`, `fresh`, or `error`; debounce edit bursts with a small configurable delay; and ignore any worker response whose request id is older than the latest queued draft. Because worker messages are copied rather than shared, the message payloads should stay small and serializable: request id, draft text, timing metadata, and the computed snapshot. That is enough for Phase 2 and still compatible with richer findings later.

**Primary recommendation:** Add a dedicated module worker plus a tiny typed scheduler/client layer in `src/features/analysis/`, keep a manual `Refresh now` control alongside automatic debounce, and terminate the worker on cleanup so the app remains responsive, local-only, and ready for richer future analysis.

## Standard Stack

### Core
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| Dedicated Web Worker | browser-native | Run analysis away from the typing thread | Standard browser primitive for background computation without UI blocking. |
| `postMessage()` + structured clone | browser-native | Pass request and result payloads between UI and worker | Standard worker messaging model; no custom transport or shared mutable state required. |
| Vite module worker loading | Vite 7.3.1 | Bundle worker entry safely in dev and build | Official Vite pattern for worker imports and static analysis. |
| React state + effects | React 19.2.4 | Drive queued/running/fresh UI updates | Fits the existing app architecture without adding state libraries. |

### Supporting
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| `setTimeout` / `clearTimeout` | browser-native | Debounce edit bursts before dispatch | Use in the scheduler so typing does not enqueue a worker run for every keystroke. |
| `Worker.terminate()` | browser-native | Clean up the dedicated worker on app teardown | Use when disposing the worker client so stale threads do not linger after unmounts or future resets. |
| Vitest fake timers | Vitest 4.0.18 | Verify debounce timing and stale-result suppression | Use for deterministic scheduler tests without slow real-time waits. |
| React Testing Library | 16.3.2 | Verify visible queued/running/current states in the UI | Use for background-refresh behavior from the user's perspective. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dedicated Web Worker now | Keep analysis on the main thread with debounce only | Simpler today, but it delays the isolation Phase 3 will need and risks a second refactor once rules get heavier. |
| Single persistent worker | Spawn a new worker per analysis run | Easier cancellation semantics, but startup churn is unnecessary for repeated short-lived local analyses. |
| Module worker + typed messages | SharedWorker | SharedWorker adds complexity without benefit for a single-tab, single-draft product. |
| JavaScript snapshot logic | WASM now | Premature for the current snapshot workload; adds packaging and debugging cost before profiling justifies it. |

## Architecture Patterns

### Recommended Project Structure
```text
src/
├── features/analysis/
│   ├── lib/                # Worker client and debounce scheduler
│   ├── workers/            # Dedicated worker entry points
│   └── types.ts            # Message protocol and lifecycle contracts
├── features/workspace/
│   ├── components/         # Editor and snapshot presentation
│   └── lib/createLocalSnapshot.ts
└── App.tsx                 # Draft state + analysis orchestration
```

### Pattern 1: Stable worker boundary around existing pure analysis
**What:** Reuse `createLocalSnapshot` inside a dedicated worker instead of duplicating logic or inventing a second analysis path.
**When to use:** Immediately in Phase 2, because the current analysis helper is already pure and worker-friendly.
**Example:**
```typescript
self.onmessage = (event: MessageEvent<AnalysisJobRequest>) => {
  const { requestId, draft } = event.data;

  postMessage({
    requestId,
    snapshot: createLocalSnapshot(draft),
    completedAt: Date.now(),
  } satisfies AnalysisJobResult);
};
```

### Pattern 2: Latest-result-wins request protocol
**What:** Tag every request and response with a monotonically increasing `requestId`, then ignore any response older than the newest draft dispatch.
**When to use:** Use whenever draft text changes faster than worker jobs return, which is exactly the normal Phase 2 typing pattern.
**Example:**
```typescript
let nextRequestId = 0;
let latestAcceptedId = 0;

function analyze(draft: string) {
  const requestId = ++nextRequestId;
  worker.postMessage({ requestId, draft });
  return requestId;
}

worker.onmessage = (event) => {
  if (event.data.requestId < latestAcceptedId) {
    return;
  }

  latestAcceptedId = event.data.requestId;
  handleFreshResult(event.data.snapshot);
};
```

### Pattern 3: Main-thread debounce controller separate from UI components
**What:** Put timing and worker dispatch rules in a scheduler utility or hook so `App.tsx` coordinates state while presentational components stay focused on rendering.
**When to use:** Right away, because debounce timing, manual refresh, and cleanup behavior are orchestration concerns rather than editor markup concerns.
**Example:**
```typescript
const scheduler = createAnalysisScheduler({
  delayMs: 300,
  client,
  onStatusChange: setAnalysisState,
  onResult: setSnapshot,
});

function handleDraftChange(nextDraft: string) {
  setDraft(nextDraft);
  scheduler.queue(nextDraft);
}
```

### Anti-Patterns to Avoid
- **Background work without stale-result guards:** A worker alone is not enough if an older reply can overwrite a newer draft's state.
- **Worker creation inside every keystroke path:** Recreating workers repeatedly wastes time and complicates cleanup.
- **UI-owned timing logic everywhere:** Do not scatter `setTimeout` calls through `App.tsx`, `WorkspaceEditor.tsx`, and `WorkspaceSnapshot.tsx`.
- **Premature WASM or parser swaps:** Phase 2 is about responsiveness plumbing, not replacing the analysis engine.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Background thread abstraction | Custom event bus or Promise RPC framework | Native worker `postMessage()` with typed payloads | The protocol is small and benefits from staying explicit. |
| Debounce helper package | `lodash.debounce` or a new dependency | Tiny local scheduler around `setTimeout` | Keeps the static bundle small and behavior easy to test. |
| Worker bundling workaround | Blob URLs or stringified inline workers | Vite `new Worker(new URL(...), { type: 'module' })` | Official bundler-safe pattern with predictable dev/build behavior. |
| Performance escalation | WASM or shared memory now | Pure JS snapshot logic in a dedicated worker | Current workload is light enough that architecture matters more than raw compute speed. |

**Key insight:** Phase 2 is mostly an orchestration problem. The current analyzer is already pure; the missing value is safe scheduling, worker isolation, and trustworthy UI state transitions.

## Common Pitfalls

### Pitfall 1: Older worker replies overwrite newer drafts
**What goes wrong:** The user types again while analysis is running, then a stale worker result marks the UI as current.
**Why it happens:** Request order and response order are treated as if they are the same.
**How to avoid:** Tag every request, keep a latest accepted id, and ignore late responses.
**Warning signs:** UI flips back to `fresh` for text the user has already changed.

### Pitfall 2: The debounce timer hides whether work is pending
**What goes wrong:** The app silently waits before re-analysis, so users cannot tell whether the panel is stale or broken.
**Why it happens:** Debounce is implemented as a timing detail with no visible state.
**How to avoid:** Distinguish `queued` from `running` in the shared analysis state and expose both in live regions.
**Warning signs:** The panel keeps old counts with no message after editing.

### Pitfall 3: Worker cleanup is forgotten
**What goes wrong:** The app leaks a worker instance across remounts, tests, or future reset flows.
**Why it happens:** The happy path focuses on message handling and ignores teardown.
**How to avoid:** Centralize worker lifetime in a client with a `dispose()` method that calls `terminate()`.
**Warning signs:** Tests hang, duplicate worker responses appear, or dev HMR produces extra messages.

### Pitfall 4: Payloads become too rich for cheap structured cloning
**What goes wrong:** Message passing becomes expensive or brittle because complex objects or callbacks are shoved into worker messages.
**Why it happens:** The worker contract grows without discipline.
**How to avoid:** Keep messages to draft text, ids, timestamps, snapshot data, and plain error metadata only.
**Warning signs:** Non-serializable values appear in request objects or worker tests need special shims.

## Code Examples

Verified patterns from browser and Vite documentation, adapted to this repo's current architecture:

### Vite-friendly module worker client
```typescript
export function createAnalysisWorkerClient() {
  const worker = new Worker(new URL('../workers/localAnalysis.worker.ts', import.meta.url), {
    type: 'module',
  });

  return {
    analyze(message: AnalysisJobRequest) {
      worker.postMessage(message);
    },
    dispose() {
      worker.terminate();
    },
  };
}
```

### Debounce scheduler with immediate refresh
```typescript
export function createAnalysisScheduler({ delayMs, analyzeNow }: SchedulerConfig) {
  let timerId: number | undefined;

  function queue(draft: string) {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(() => analyzeNow(draft), delayMs);
  }

  function flush(draft: string) {
    window.clearTimeout(timerId);
    analyzeNow(draft);
  }

  return { queue, flush };
}
```

### Deterministic debounce test with fake timers
```typescript
it('only dispatches the newest queued draft', async () => {
  vi.useFakeTimers();
  const analyzeNow = vi.fn();
  const scheduler = createAnalysisScheduler({ delayMs: 300, analyzeNow });

  scheduler.queue('first');
  scheduler.queue('second');
  await vi.advanceTimersByTimeAsync(300);

  expect(analyzeNow).toHaveBeenCalledTimes(1);
  expect(analyzeNow).toHaveBeenCalledWith('second');
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Main-thread analysis only for lightweight helpers | Dedicated workers for background compute with typed message passing | Longstanding web platform standard; Vite explicitly supports constructor-based worker loading | Better UI responsiveness and cleaner isolation for future heavier rules. |
| Worker scripts loaded by fragile page-relative URLs | `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })` | Current Vite and MDN guidance | Safer bundling, better refactors, clearer dependency ownership. |
| Fire-every-keystroke refresh loops | Debounced input-driven analysis with visible queued/running states | Current UX norm for local editors and search-like feedback loops | Preserves responsiveness while still feeling immediate to the user. |

**Deprecated/outdated:**
- Spawning inline blob workers for ordinary app code is unnecessary here because Vite already supports module workers directly.
- Waiting until Phase 3 to isolate analysis would make the heavier rule work pay both feature and architecture costs at the same time.

## Open Questions

1. **What default debounce delay should ship first?**
   - What we know: The app should feel quick after a typing pause but should not re-run analysis on every keystroke.
   - What's unclear: The exact best value for long drafts on slower laptops.
   - Recommendation: Start with a configurable 300 ms default, then revisit only if manual use shows noticeable lag or over-eager reruns.

2. **Should unsupported-worker browsers get a fallback path?**
   - What we know: Worker support is broadly available across supported browsers, but graceful degradation is still helpful.
   - What's unclear: Whether this product will intentionally support any environment without dedicated workers.
   - Recommendation: Keep a small client seam so a synchronous fallback remains possible, but optimize the planned implementation for workers first.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + React Testing Library |
| Config file | `vite.config.ts` |
| Quick run command | `npm run test -- --run src/App.test.tsx src/features/analysis/lib/createAnalysisWorkerClient.test.ts src/features/analysis/lib/createAnalysisScheduler.test.ts` |
| Full suite command | `npm run test -- --run && npm run build` |
| Estimated runtime | ~10 seconds |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WORK-03 | Typing remains responsive while analysis is queued or running in the background | unit + component | `npm run test -- --run src/features/analysis/lib/createAnalysisScheduler.test.ts src/App.test.tsx` | ❌ Wave 1 creates worker tests |
| WORK-04 | Editing or using a manual refresh control triggers a fresh analysis without reload | component | `npm run test -- --run src/App.test.tsx` | ✅ `src/App.test.tsx` exists |
| PERF-02 | Analysis refreshes shortly after a typing pause and latest results win | unit + integration | `npm run test -- --run src/features/analysis/lib/createAnalysisScheduler.test.ts src/features/analysis/lib/createAnalysisWorkerClient.test.ts && npm run build` | ❌ Wave 1 creates worker tests |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task -> run the task's targeted `vitest --run` command or `npm run build` for contract-only changes.
- **Full suite trigger:** Before closing each plan wave -> run `npm run test -- --run && npm run build`.
- **Phase-complete gate:** `npm run test -- --run && npm run build` must pass before verification.
- **Estimated feedback latency per task:** ~10 seconds.

### Wave 0 Gaps (must be created before later implementation depends on them)
- [ ] `src/features/analysis/lib/createAnalysisWorkerClient.test.ts` - worker client message-handling coverage
- [ ] `src/features/analysis/lib/createAnalysisScheduler.test.ts` - debounce, flush, and stale-result coverage

## Sources

### Primary (HIGH confidence)
- `https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers` - verified dedicated-worker behavior, message passing, background-thread model, structured cloning, and bundler-safe `new URL(..., import.meta.url)` guidance
- `https://vite.dev/guide/features.html#web-workers` - verified Vite 7 constructor-based module worker support and recommended worker import pattern
- `https://developer.mozilla.org/en-US/docs/Web/API/Worker/terminate` - verified immediate worker cleanup behavior for disposal planning

### Secondary (MEDIUM confidence)
- Existing repo code in `src/App.tsx` and `src/features/workspace/lib/createLocalSnapshot.ts` - confirmed the current analyzer is pure enough to reuse inside a worker
- Existing Phase 1 summaries and verification docs - confirmed current UI/test patterns and the established feature boundaries

## Metadata

**Confidence breakdown:**
- Worker architecture: HIGH - browser and Vite docs are direct and mature
- Scheduler and stale-result protocol: HIGH - standard background-analysis orchestration pattern with low implementation risk
- Debounce constant recommendation: MEDIUM - needs real usage validation, though 300 ms is a reasonable starting point

**Research date:** 2026-03-09
**Valid until:** 2026-04-08
