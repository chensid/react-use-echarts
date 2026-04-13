# react-use-echarts — Development Guide

React hooks library for Apache ECharts. Hook + declarative component, TypeScript, zero runtime deps.

- **Peer deps:** React 19+ (`react` + `react-dom`), ECharts 6.x | **CSR only** | **Package manager:** pnpm

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
│   ├── use-echarts.ts          # Orchestrator hook (loading, group effects + delegates to internal hooks)
│   ├── use-lazy-init.ts        # IntersectionObserver hook
│   └── internal/
│       ├── use-chart-core.ts   # Core: instance lifecycle + option sync + event rebinding + loading + group (5 effects)
│       ├── use-resize-observer.ts # ResizeObserver auto-resize (1 effect)
│       └── event-utils.ts      # Pure functions: bindEvents / unbindEvents
├── themes/
│   ├── index.ts                # Lightweight theme utilities (no JSON)
│   ├── registry.ts             # Built-in theme registration (imports JSON)
│   └── presets/                # Built-in theme JSON (light/dark/macarons)
├── utils/
│   ├── instance-cache.ts       # WeakMap instance cache + reference counting
│   ├── connect.ts              # Chart group linkage logic
│   └── shallow-equal.ts        # Shallow equality for option deduplication
├── types/index.ts              # All type definitions
└── __tests__/                  # Mirror structure: components/, hooks/, themes/, utils/
```

## Architecture

### Hook Decomposition — 7 Effects Across 2 Modules

All instance-related state lives in `useChartCore`; the orchestrator has zero effects of its own.

**`useChartCore`** (6 effects — ref sync + init applies all state for instance recreation, separate effects handle dynamic changes):

0. **Ref Sync** (`useLayoutEffect`, no deps) — keep 9 refs in sync with latest props every render

1. **Instance Lifecycle** (`useLayoutEffect`) — create/dispose instance, apply initial option, events, loading, group
2. **Option Updates** (`useEffect`) — call `setOption` when option changes (dedup via `shallowEqual` + `lastAppliedRef`)
3. **Event Rebinding** (`useEffect`) — unbind old, bind new when `onEvents` changes (via `boundEventsRef`)
4. **Loading State** (`useEffect`) — toggle `showLoading` / `hideLoading` on dynamic changes
5. **Group Changes** (`useEffect`) — switch chart group dynamically

**`useResizeObserver`** (1 fully independent effect):

6. **Resize Observer** (`useEffect`) — create/destroy ResizeObserver with RAF throttle

### Key Design Patterns

- Ref passed in by caller — hook does not create refs internally
- `useChartCore` owns all shared state internally — `lastAppliedRef`, `boundEventsRef`, and 9 synced refs never leak to callers
- `useChartCore(ref, shouldInit, config)` — 3-parameter API via config object
- WeakMap instance cache + reference counting — safe under StrictMode (instance recreated cleanly; refCount prevents premature disposal when multiple consumers share an element)
- initOpts / theme serialized to stable keys — prevents instance recreation from inline objects
- Two-level theme cache — custom theme objects auto-deduplicated (with circular reference protection); `contentHash` param avoids double JSON.stringify
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
- **Build outputs:** `dist/index.js` (ESM), `dist/index.umd.js` (UMD), `dist/index.d.ts`, `dist/themes/registry.js` + `.d.ts` (theme subpath)

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
