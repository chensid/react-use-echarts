# react-use-echarts — Development Guide

React hooks library for Apache ECharts. Hook + declarative component, TypeScript, zero runtime deps.

- **Peer deps:** React 19.2+ (`react` + `react-dom`; `useEffectEvent` requires 19.2), ECharts 6.x | **Runtime:** Node 22.13+ | **CSR only** | **ESM-only** | **Package manager:** pnpm

## Vite+ Toolchain

> Full rules and common pitfalls: `node_modules/vite-plus/AGENTS.md`

Project-specific commands:

```bash
vp install                    # Install dependencies
vp dev                        # Dev server (localhost:3000, serves examples/)
vp build                      # Build examples app → site-dist/
vp pack                       # Library build → dist/
vp test                       # Single run
vp test watch                 # Watch mode
vp test --coverage            # Coverage report (v8)
vp lint                       # Oxlint
vp check                      # format + lint + typecheck (typecheck via tsgolint)
```

**Pre-PR checklist:** `vp check && vp test`

### Vite+ 0.2.x toolchain (since #458; aligned to 0.2.2)

Vite+ 0.2.2 bundles **Vite 8.1.2 + Rolldown 1.1.4 + Vitest 4.1.9 + Oxfmt 0.57.0 + Oxlint 1.72.0** inside the `vite-plus` toolchain. The separate `@voidzero-dev/vite-plus-test` package is **dead** (no 0.2.x exists). Consequences for dep management:

- Dependency versions live in the root `pnpm-workspace.yaml` `catalog`. `package.json` uses `catalog:` for `vite`, `vite-plus`, `vitest`, `@vitest/browser-playwright`, and `@vitest/coverage-v8`.
- Keep `pnpm-workspace.yaml` overrides for both `vite` → `@voidzero-dev/vite-plus-core` and `vitest` → the exact bundled Vitest version. This keeps Vite+ internals, browser providers, coverage, and `vp test` on one runner copy.
- Upgrade Vite+ with the global CLI first (`vp upgrade`), then run `vp migrate --full --no-interactive` in the repo. Let the migrator update catalog pins, overrides, lockfile policy exclusions, editor/agent/hook setup, and then review the diff.
- Tests still import from `vite-plus/test`. Browser-mode providers are **opt-in peers**: `@vitest/browser-playwright` (its `playwright` peer is installed too), imported from `vite-plus/test/browser-playwright`. Keep provider and coverage package versions aligned to the catalog's bundled Vitest pin.

## Codebase Structure

```
src/
├── index.ts                    # Package entry, re-exports everything. Modular — does NOT side-effect-import "echarts" (legacy `/core` subpath was removed in v3)
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
└── __tests__/                  # Mirror structure: components/, hooks/, themes/, utils/ + browser/ (real-chromium smoke tests)
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
- Errors from `init` / `setOption` / `dispatchAction` / `resize` / event-bind / `showLoading` / group ops (`updateGroup` → `connect` / `disconnect`) route through the shared `onError` callback (or fall back to `console.error` / re-throw); cleanup-path `off` (unbind) and `dispose` (release) are try/caught too, so an effect-cleanup throw can't disrupt React commit. The lone deliberately-bare call is `off()` in the Event-Rebinding effect (see its inline comment — a same-handler rebind must unbind before binding). Effect-context errors flow through `useEffectEvent` for always-latest `onError`; imperative-API errors flow through `latestRef.current.onError` because `useEffectEvent` cannot be called outside Effects.
- `shallowEqual` on option updates — avoids unnecessary `setOption` when top-level keys are identical
- `eventsEqual` on event rebinding — avoids unnecessary unbind/rebind when inline event objects have identical handlers
- `setOption` / `showLoading` lifecycle attempts are recorded into `lastAppliedRef` / `lastLoadingRef` via `try/finally` even on failure — Option-Sync / Loading-Toggle dedup against the same (option, opts) pair instead of replaying a known-bad call and double-firing `onError`
- Memoized return value — `useChartCore` manually wraps its imperative API in `useMemo([element])` (since React Compiler does not memoize this hook); `useEcharts` is compiler-cached, so `{ ref, ...chart }` is stable when `chart` is stable
- React Compiler enabled via `@vitejs/plugin-react` + `@rolldown/plugin-babel` (`reactCompilerPreset()`). **TODO (native, Babel-free path):** the Rust port of React Compiler landed in oxc v0.135.0 (2026-06-08, oxc-project/oxc#22942), exposed as a `reactCompiler` transform option — still experimental. Three gates remain — the **oxc ≥ 0.135 gate is now cleared** (✓ since #458; vite-plus 0.2.2 bundles rolldown 1.1.4 / oxc 0.138). Still blocked on: (1) the `reactCompiler` transform being de-experimentalized, and (2) `@vitejs/plugin-react` surfacing it as a first-class option. Once both land, drop `@rolldown/plugin-babel` + `reactCompilerPreset()` (and the `@babel/core` devDep) in favor of the native transform. (Note: `@rolldown/plugin-babel` still drags a stray npm `rolldown@1.0.0-rc.18` (oxc 0.128) into the tree as its peer, but the build uses vite-plus-core's bundled rolldown 1.1.4.) No upstream date committed — watch oxc release notes, the `@vitejs/plugin-react` CHANGELOG, and the vite-plus changelog.
- `<EChart>` imperative handle exposes `EChartHandle = Omit<UseEchartsReturn, "ref">` — `ref` is intentionally stripped so external callers cannot reassign the container via `handle.ref(otherNode)`

## Testing

- Two Vitest projects (`test.projects` in `vite.config.ts`): **`unit`** — happy-dom + ECharts API fully mocked (`src/__tests__/**`, excludes `browser/`); **`browser`** — real chromium via the opt-in `@vitest/browser-playwright` provider (imported from `vite-plus/test/browser-playwright`; `src/__tests__/browser/**`), for what happy-dom can't simulate (IntersectionObserver/ResizeObserver + RAF in a real viewport, real layout). Smoke level: assert effects are observable, not exact frame counts.
- Tests in `src/__tests__/` mirror `src/` layout
- Shared mocks in `src/__tests__/helpers.ts`: `createMockInstance`, `MockResizeObserver`, `MockIntersectionObserver`
- Config: `test` block in `vite.config.ts` — `clearMocks` / `mockReset` / `restoreMocks` all enabled
- `globals: true` — import from `"vite-plus/test"` for type safety

### Test Gotchas

- Always `vi.mock("echarts/core")` before importing modules that depend on echarts
- Mock instance shape must match `createMockInstance` from helpers
- `MockIntersectionObserver.observe` triggers callback immediately with `isIntersecting: true`

## Conventions

- **Commit format:** `feat|fix|docs|test|refactor|chore: <subject>`
- **Types-first:** define types in `src/types/index.ts` before implementing
- **Paired cleanup:** all side effects must have cleanup functions
- **Build outputs:** `dist/index.js`, `dist/preset-full.js`, and `dist/themes/registry.js` + matching `.d.ts` files (ESM). `publint` + `attw` (`esm-only` profile) run automatically via `vp pack`.
- **ECharts registration is the consumer's responsibility** — this library does NOT auto-register charts/components/renderers/features. Apps call `registerEchartsFull()` (from `react-use-echarts/preset-full`) for the everything-included path, or `echarts.use([...])` selectively. Mirrors `vue-echarts` / `nuxt-echarts` / `react-chartjs-2`. See `src/preset-full.ts` for the why.

## Anti-patterns

- **DO NOT** create effects without paired cleanup functions
- **DO NOT** pass un-memoized theme objects (two-level cache is a safety net, not a guarantee)
- **DO NOT** duplicate API reference from `README.md` into this file
- **DO NOT** re-add the removed `react-use-echarts/core` subpath — v3 consumers should import from `react-use-echarts`.
- **DO NOT** re-add `import "echarts"` to `src/index.ts` — production minifiers DCE its top-level `use([...])` registrations. Registration belongs in consumer-side code (their app entry or `registerEchartsFull()`).
- **DO NOT** import from `vitest` in tests or add `@voidzero-dev/vite-plus-test`. The `vitest` package is present only as an exact Vite+ catalog/override pin so Vite+ internals and opt-in providers share the bundled runner copy.

## Troubleshooting

| Problem                                                              | Cause                                                                     | Fix                                                                                                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Test fails: "echarts not mocked"                                     | Missing `vi.mock("echarts/core")`                                         | Add mock before imports                                                                                                                      |
| Test lint errors                                                     | `tsconfig.test.json` not correct                                          | Check `include` patterns                                                                                                                     |
| Build fails with `vp pack`                                           | External peer not configured                                              | Check `pack.outputOptions.globals` in `vite.config.ts`                                                                                       |
| StrictMode double-mount issues                                       | Instance cache refCount mismatch                                          | Check `src/utils/instance-cache.ts` logic                                                                                                    |
| `TypeError: ka[a] is not a constructor` at first `useEcharts()` init | App forgot to register charts/renderers                                   | Call `registerEchartsFull()` at app entry, or `echarts.use([...])` selectively before render                                                 |
| `vp test`: `Could not find 'vitest' bin entry`                       | Stale `vitest`/`vite-plus-test` alias or mismatched catalog/override pins | Rerun `vp migrate --full --no-interactive`, keep tests on `vite-plus/test`, and verify `vp --version` bundled Vitest matches the catalog pin |
