# react-use-echarts — Development Guide

React hooks library for Apache ECharts. Hook + declarative component, TypeScript, zero runtime deps.

- **Peer deps:** React 19+ (`react` + `react-dom`), ECharts 6.x | **Runtime:** Node 22+ | **CSR only** | **ESM-only** | **Package manager:** pnpm

## Vite+ Toolchain

> Full rules and common pitfalls: `node_modules/vite-plus/AGENTS.md`

Project-specific commands:

```bash
vp install                    # Install dependencies
vp dev                        # Dev server (localhost:3000, serves examples/)
vp build                      # Build examples app
vp pack                       # Library build → dist/
vp test                       # Single run (default since vite-plus 0.1.x)
vp test watch                 # Watch mode
vp test --coverage            # Coverage report (v8)
vp lint                       # Oxlint
vp check                      # format + lint + typecheck (typecheck via tsgolint)
```

**Pre-PR checklist:** `vp check && vp test`

## Codebase Structure

```
src/
├── index.ts                    # Package entry, re-exports everything. Modular — does NOT side-effect-import "echarts" (since v2.1; previously did, but Rolldown/Oxc DCE breaks that path)
├── core.ts                     # DEPRECATED alias of index.ts (removed in v4); identical re-exports for v2.0-era `from "react-use-echarts/core"` imports
├── preset-full.ts              # `registerEchartsFull()` sugar — one-call namespace-spread of echarts/charts + components + renderers + features, registered via `echarts.use(...)`. Consumer-side replacement for `import "echarts"`.
├── components/EChart.tsx       # Declarative component wrapping useEcharts
├── hooks/
│   ├── use-echarts.ts          # Orchestrator hook (zero effects of its own; delegates to internal hooks)
│   ├── use-lazy-init.ts        # IntersectionObserver hook — `useLazyInit(options) → { ref, isInView }` callback-ref shape
│   └── internal/
│       ├── use-chart-core.ts   # Core: instance lifecycle + option sync + event rebinding + loading + group (6 effects); exposes the imperative API (setOption, dispatchAction, clear, resize, appendData, getOption, getDataURL, convertToPixel, …) and a reactive `instance` field
│       ├── use-resize-observer.ts # ResizeObserver auto-resize + visibilitychange resync (1 effect; onError reached via useEffectEvent)
│       └── event-utils.ts      # Pure functions: bindEvents / unbindEvents / eventsEqual
├── themes/
│   ├── index.ts                # Lightweight theme utilities (no JSON); FIFO contentHashCache for custom themes
│   ├── registry.ts             # Built-in theme registration (imports JSON)
│   └── presets/                # Built-in theme JSON (light/dark/macarons)
├── utils/
│   ├── instance-cache.ts       # WeakMap instance cache + reference counting (warns on mismatched setCachedInstance)
│   ├── connect.ts              # Chart group linkage logic (one connect() per groupId; disconnect when last member leaves)
│   ├── shallow-equal.ts        # Shallow equality for option / setOptionOpts / loadingOption deduplication
│   ├── stable-key.ts           # Stable dependency keys via JSON.stringify (per-reference id fallback when not serializable; null only for nullish or unsupported primitives — strings/numbers pass through)
│   ├── merge-refs.ts           # Compose multiple refs (RefObject / RefCallback / React 19 cleanup-callback) into one callback ref; per-ref try/catch isolation
│   ├── error.ts                # Imperative-path error routing helper (`routeImperativeError`)
│   ├── dev-warnings.ts         # Shared dev-mode warning sets (unknown theme, zero-size container)
│   └── visibility-coordinator.ts # Module-level `document.visibilitychange` coordinator — single shared DOM listener serving all charts (`subscribeVisibilityResume`); attaches on first subscriber, detaches on last
├── types/index.ts              # All type definitions
└── __tests__/                  # Mirror structure: components/, hooks/, themes/, utils/
```

## Architecture

### Hook Decomposition

All instance-related state lives in `useChartCore`; the orchestrator (`useEcharts`) has zero effects of its own. Effects are described by responsibility — there is no global numbering, since adding/removing one shouldn't shift the others' identities.

**`useChartCore`** — six effects, grouped by what they keep in sync. Initial application is bundled inside the lifecycle effect; the others handle dynamic post-init changes.

- **Ref Sync** (`useLayoutEffect`, no deps) — sync the typed `latestRef` (one `ImperativeLatest` object holding `setOptionOpts` and `onError`) every render. Only the imperative API (`withInstance` inside `useMemo`) reads via this ref, since `useEffectEvent` is forbidden outside effects. Effect-context error routing uses `useEffectEvent` directly (no ref); the 8 other config fields are captured by closure inside the lifecycle effect or flow as deps to their owning sync effect.
- **Instance Lifecycle** (`useLayoutEffect`) — create/dispose instance, apply initial option, events, loading, group; warns on zero-size container in dev. Re-runs only on structural deps (`element` / `themeKey` / `renderer` / `initOptsKey`).
- **Option Sync** (`useEffect`) — call `setOption` when option changes (reference-equality fast path → `shallowEqual` + `lastAppliedRef`).
- **Event Rebinding** (`useEffect`) — unbind old, bind new when `onEvents` changes (via `lastBoundRef` + `eventsEqual`; treats empty/undefined as equivalent).
- **Loading Toggle** (`useEffect`) — toggle `showLoading` / `hideLoading` on dynamic changes (dedup via `lastLoadingRef` + `shallowEqual` on `loadingOption`).
- **Group Switch** (`useEffect`) — switch chart group dynamically via `updateGroup`.

**`useResizeObserver`** — one effect.

- **Resize Observer** (`useEffect`) — create/destroy ResizeObserver with RAF throttle; also subscribes to a foreground resync via `subscribeVisibilityResume` (from `utils/visibility-coordinator.ts`) so the chart re-resizes when the tab returns to foreground (RAF is throttled in hidden tabs). The coordinator owns a single shared `document.visibilitychange` listener for all charts rather than one listener per instance. Latest `onError` is reached via `useEffectEvent` (no separate ref-sync effect).

### Key Design Patterns

- Callback-ref API — `useEcharts` owns the container ref internally: a `useCallback` callback ref + `useState<HTMLDivElement | null>` writes the live element into hook state, then the React 19 ref-cleanup return path clears it on unmount. Consumers receive a stable `ref` field and attach it to their container `<div ref={ref}>`. DOM-node replacement is detected because the ref-callback identity is stable while React itself fires `ref(newNode)` + cleanup with the old node.
- `useChartCore` owns all shared state internally — `lastAppliedRef`, `lastBoundRef`, `lastLoadingRef`, and the typed `latestRef` never leak to callers
- `useChartCore(element, shouldInit, config)` — 3-parameter API; takes the resolved element (not a ref) so DOM-node replacement re-triggers the lifecycle effect
- WeakMap instance cache + reference counting — safe under StrictMode (instance recreated cleanly; refCount prevents premature disposal when multiple consumers share an element)
- initOpts / theme serialized to stable keys via `computeStableKey` — JSON.stringify-based; non-serializable objects fall back to a per-reference id (still dedups by reference); only nullish or unsupported primitives (e.g. boolean/symbol) return `null` — strings and numbers pass through. Each key is memoized via `useMemo` on the raw input ref (React Compiler skips this hook, so the calls aren't auto-memoized — see `src/hooks/internal/use-chart-core.ts`)
- Two-level theme cache — custom theme objects auto-deduplicated; `contentHash` param avoids double JSON.stringify; `contentHashCache` is a FIFO with a 100-entry cap
- Errors from `init` / `setOption` / `dispatchAction` / `resize` / event-bind route through the shared `onError` callback (or fall back to `console.error` / re-throw); calls that don't throw on real instances (`off`, `dispose`, `connect`, `showLoading`, group assignment) are uninstrumented. Effect-context errors flow through `useEffectEvent` for always-latest `onError`; imperative-API errors flow through `latestRef.current.onError` because `useEffectEvent` cannot be called outside Effects.
- `shallowEqual` on option updates — avoids unnecessary `setOption` when top-level keys are identical
- `eventsEqual` on event rebinding — avoids unnecessary unbind/rebind when inline event objects have identical handlers
- `setOption` / `showLoading` lifecycle attempts are recorded into `lastAppliedRef` / `lastLoadingRef` via `try/finally` even on failure — Option-Sync / Loading-Toggle dedup against the same (option, opts) pair instead of replaying a known-bad call and double-firing `onError`
- Memoized return value — `useChartCore` manually wraps its imperative API in `useMemo([element])` (since React Compiler does not memoize this hook); `useEcharts` is compiler-cached, so `{ ref, ...chart }` is stable when `chart` is stable
- React Compiler enabled via `@vitejs/plugin-react` + `@rolldown/plugin-babel`
- `<EChart>` imperative handle exposes `EChartHandle = Omit<UseEchartsReturn, "ref">` — `ref` is intentionally stripped so external callers cannot reassign the container via `handle.ref(otherNode)`

## Testing

- Vitest + jsdom, ECharts API fully mocked
- Tests in `src/__tests__/` mirror `src/` layout
- Shared mocks in `src/__tests__/helpers.ts`: `createMockInstance`, `MockResizeObserver`, `MockIntersectionObserver`
- Config: `test` block in `vite.config.ts` — `clearMocks` / `mockReset` / `restoreMocks` all enabled
- `globals: true` — import from `"vite-plus/test"` for type safety

### Test Gotchas

- Always `vi.mock("echarts")` before importing modules that depend on echarts
- Mock instance shape must match `createMockInstance` from helpers
- `MockIntersectionObserver.observe` triggers callback immediately with `isIntersecting: true`

## Conventions

- **Commit format:** `feat|fix|docs|test|refactor|chore: <subject>`
- **Types-first:** define types in `src/types/index.ts` before implementing
- **Paired cleanup:** all side effects must have cleanup functions
- **Build outputs:** `dist/{index,core,preset-full}.js` + `.d.ts` (ESM), `dist/themes/registry.js` + `.d.ts` (theme subpath). `publint` + `attw` (`esm-only` profile) run automatically via `vp pack`.
- **ECharts registration is the consumer's responsibility** — this library does NOT auto-register charts/components/renderers/features. Apps call `registerEchartsFull()` (from `react-use-echarts/preset-full`) for the everything-included path, or `echarts.use([...])` selectively. Mirrors `vue-echarts` / `nuxt-echarts` / `react-chartjs-2`. See `src/preset-full.ts` for the why.

## Anti-patterns

- **DO NOT** create effects without paired cleanup functions
- **DO NOT** pass un-memoized theme objects (two-level cache is a safety net, not a guarantee)
- **DO NOT** duplicate API reference from `README.md` into this file
- **DO NOT** re-add `import "echarts"` to `src/index.ts` — production minifiers DCE its top-level `use([...])` registrations. Registration belongs in consumer-side code (their app entry or `registerEchartsFull()`).

## Troubleshooting

| Problem                                                              | Cause                                   | Fix                                                                                          |
| -------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| Test fails: "echarts not mocked"                                     | Missing `vi.mock("echarts")`            | Add mock before imports                                                                      |
| Test lint errors                                                     | `tsconfig.test.json` not correct        | Check `include` patterns                                                                     |
| Build fails with `vp pack`                                           | External peer not configured            | Check `pack.outputOptions.globals` in `vite.config.ts`                                       |
| StrictMode double-mount issues                                       | Instance cache refCount mismatch        | Check `src/utils/instance-cache.ts` logic                                                    |
| `TypeError: ka[a] is not a constructor` at first `useEcharts()` init | App forgot to register charts/renderers | Call `registerEchartsFull()` at app entry, or `echarts.use([...])` selectively before render |
