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
vp test                       # Vitest (watch mode)
vp test run                   # Single run
vp test run --coverage        # Coverage report (v8)
vp lint .                     # Oxlint
vp check                      # format + lint + typecheck
```

**Pre-PR checklist:** `vp check && vp test run`

## Codebase Structure

```
src/
├── index.ts                    # Package entry, re-exports everything
├── components/EChart.tsx       # Declarative component wrapping useEcharts
├── hooks/
│   ├── use-echarts.ts          # Orchestrator hook (zero effects of its own; delegates to internal hooks)
│   ├── use-lazy-init.ts        # IntersectionObserver hook
│   └── internal/
│       ├── use-chart-core.ts   # Core: instance lifecycle + option sync + event rebinding + loading + group (6 effects); exposes setOption / dispatchAction / clear / getInstance
│       ├── use-resize-observer.ts # ResizeObserver auto-resize + visibilitychange resync (2 effects: onError ref sync + observer)
│       ├── use-ref-element.ts  # Track ref.current across DOM-node replacement (re-runs effects when ref swaps)
│       └── event-utils.ts      # Pure functions: bindEvents / unbindEvents / eventsEqual
├── themes/
│   ├── index.ts                # Lightweight theme utilities (no JSON); LRU contentHashCache for custom themes
│   ├── registry.ts             # Built-in theme registration (imports JSON)
│   └── presets/                # Built-in theme JSON (light/dark/macarons)
├── utils/
│   ├── instance-cache.ts       # WeakMap instance cache + reference counting (warns on mismatched setCachedInstance)
│   ├── connect.ts              # Chart group linkage logic (syncGroupConnectivity centralizes connect/disconnect)
│   ├── shallow-equal.ts        # Shallow equality for option / setOptionOpts / loadingOption deduplication
│   ├── stable-key.ts           # Stable dependency keys via JSON + circular-id WeakMap fallback
│   └── dev-warnings.ts         # Shared dev-mode warning sets (unknown theme, zero-size container)
├── types/index.ts              # All type definitions
└── __tests__/                  # Mirror structure: components/, hooks/, themes/, utils/
```

## Architecture

### Hook Decomposition — 8 Effects Across 2 Modules

All instance-related state lives in `useChartCore`; the orchestrator has zero effects of its own.

**`useChartCore`** (6 effects — ref sync + init applies all state for instance recreation, separate effects handle dynamic changes):

0. **Ref Sync** (`useLayoutEffect`, no deps) — sync the typed `latestRef` (one `LatestConfig` object holding all 10 latest config fields) every render so dependent effects read fresh values without re-running. Adding a new field forces it to appear in both the initializer and the sync block; TS catches stale-config drift at compile time.

1. **Instance Lifecycle** (`useLayoutEffect`) — create/dispose instance, apply initial option, events, loading, group; warns on zero-size container in dev
2. **Option Updates** (`useEffect`) — call `setOption` when option changes (reference-equality fast path → `shallowEqual` + `lastAppliedRef`)
3. **Event Rebinding** (`useEffect`) — unbind old, bind new when `onEvents` changes (via `boundEventsRef` + `eventsEqual`; treats empty/undefined as equivalent)
4. **Loading State** (`useEffect`) — toggle `showLoading` / `hideLoading` on dynamic changes (dedup via `lastLoadingRef` + `shallowEqual` on `loadingOption`)
5. **Group Changes** (`useEffect`) — switch chart group dynamically via `syncGroupConnectivity`

**`useResizeObserver`** (2 effects):

6. **onError Ref Sync** (`useLayoutEffect`, no deps) — keep latest `onError` callback reachable from inside the observer effect
7. **Resize Observer** (`useEffect`) — create/destroy ResizeObserver with RAF throttle; also listens to `document.visibilitychange` to resync when the tab returns to foreground (RAF is throttled in hidden tabs)

### Key Design Patterns

- Ref passed in by caller — hook does not create refs internally; `useRefElement` tracks `ref.current` so effects re-run if the DOM node is swapped
- `useChartCore` owns all shared state internally — `lastAppliedRef`, `boundEventsRef`, `lastLoadingRef`, and the typed `latestRef` never leak to callers
- `useChartCore(element, shouldInit, config)` — 3-parameter API; takes the resolved element (not a ref) so DOM-node replacement re-triggers the lifecycle effect
- WeakMap instance cache + reference counting — safe under StrictMode (instance recreated cleanly; refCount prevents premature disposal when multiple consumers share an element)
- initOpts / theme serialized to stable keys via `computeStableKey` — JSON.stringify with a WeakMap-backed circular-id fallback prevents instance recreation from inline objects
- Two-level theme cache — custom theme objects auto-deduplicated (with circular-reference protection); `contentHash` param avoids double JSON.stringify; `contentHashCache` is a true LRU
- Errors from `setOption` / `dispatchAction` / ResizeObserver init route through the shared `onError` callback (or fall back to `console.error` / re-throw)
- `shallowEqual` on option updates — avoids unnecessary `setOption` when top-level keys are identical
- `eventsEqual` on event rebinding — avoids unnecessary unbind/rebind when inline event objects have identical handlers
- Memoized return value — `useMemo` ensures referential stability
- React Compiler enabled via `@vitejs/plugin-react` + `@rolldown/plugin-babel`

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
- **Build outputs:** `dist/index.js` + `.d.ts` (ESM), `dist/themes/registry.js` + `.d.ts` (theme subpath). `publint` + `attw` run automatically via `vp pack`.

## Anti-patterns

- **DO NOT** create effects without paired cleanup functions
- **DO NOT** pass un-memoized theme objects (two-level cache is a safety net, not a guarantee)
- **DO NOT** duplicate API reference from `README.md` into this file

## Troubleshooting

| Problem                          | Cause                            | Fix                                                    |
| -------------------------------- | -------------------------------- | ------------------------------------------------------ |
| Test fails: "echarts not mocked" | Missing `vi.mock("echarts")`     | Add mock before imports                                |
| Test lint errors                 | `tsconfig.test.json` not correct | Check `include` patterns                               |
| Build fails with `vp pack`       | External peer not configured     | Check `pack.outputOptions.globals` in `vite.config.ts` |
| StrictMode double-mount issues   | Instance cache refCount mismatch | Check `src/utils/instance-cache.ts` logic              |
