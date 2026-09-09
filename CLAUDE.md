# react-use-echarts — Development Guide

React hooks library for Apache ECharts. Hook + declarative component, TypeScript, zero runtime deps.

- **Peer deps:** React 19.2+ (`react` + `react-dom`; `useEffectEvent` requires 19.2), ECharts 6.x | **Tooling:** Node 22.18+ on 22.x, 24.11+ on 24.x, or 26+ | **CSR only** | **ESM-only** | **Package manager:** pnpm

## Vite+ Toolchain

> Full rules and common pitfalls: `node_modules/vite-plus/AGENTS.md`

Project-specific commands:

```bash
vp install                    # Install dependencies
vp dev                        # Dev server (localhost:3000, serves examples/)
vp build                      # Build examples app → site-dist/
vp pack                       # Library build → dist/
vp exec playwright install chromium # Install Chromium once (`--with-deps` on Linux/CI)
vp test                       # Single run of both configured projects
vp test --project unit        # Unit/happy-dom project only
vp test --project browser     # Real-Chromium browser project only
vp test watch                 # Watch mode
vp test --coverage --project unit # Coverage report (v8), matching CI
vp lint                       # Oxlint
vp check                      # format + lint + typecheck (typecheck via tsgolint)
```

**Pre-PR checklist:** install Chromium once, then run `vp check && vp test` (both projects).

### Vite+ toolchain

Vite+ manages Vite, Rolldown, Vitest, Oxfmt, Oxlint, oxlint-tsgolint, and tsdown as one toolchain. Read the current Vite+ pins from `pnpm-workspace.yaml` and run `vp toolchain` for bundled tool versions. Do not add the obsolete `@voidzero-dev/vite-plus-test` package. Consequences for dependency management:

- Dependency versions live in the root `pnpm-workspace.yaml` `catalog`. `package.json` uses `catalog:` for `vite`, `vite-plus`, `vitest`, `@vitest/browser-playwright`, and `@vitest/coverage-v8`.
- Keep `pnpm-workspace.yaml` overrides for both `vite` → `@voidzero-dev/vite-plus-core` and `vitest` → the exact bundled Vitest version. This keeps Vite+ internals, browser providers, coverage, and `vp test` on one runner copy. The override keys carry an explicit `@*` range (`vite@*` / `vitest@*`): a bare key matches every spec including `catalog:`, so `vp up` would rewrite the catalog reference to a concrete version. Do not drop the `@*`.
- Upgrade Vite+ with the global CLI first (`vp upgrade`), then run `vp migrate --no-interactive` in the repo. Review the updated catalog pins, overrides, lockfile policy exclusions, and build configuration. Add `--full` only when deliberately refreshing editor/agent/hook setup. Keep Vitest and its browser/coverage packages at the version supported by Vite+, even when npm offers a newer major.
- The project pins pnpm through `package.json#packageManager`; Vite+ provisions that version. Update it with `vp env pin pnpm@<version> --target package-manager --force`, then run `vp install` and verify `vp install --frozen-lockfile`. See `CONTRIBUTING.md` for the upgrade workflow.
- pnpm enforces a built-in 24h `minimumReleaseAge` gate and, in loose mode, self-populates `minimumReleaseAgeExclude` in `pnpm-workspace.yaml` whenever an install pulls a version younger than 24h — so entries accumulate on their own. Each entry is a no-op once its version ages past 24h; `minimumReleaseAgeExcludePrune: true` (pnpm 11.22+) is enabled in `pnpm-workspace.yaml`, so `pnpm add`/`update`/`remove` auto-prune stale entries — manual pruning (check real publish times via `npm view <pkg> time`) is only needed outside those commands. Treat the list as generated installation policy, not permanent dependency configuration. Retain entries while their versions are still inside the release-age window; do not assume the list should be empty after an upgrade. Verify with `vp install --frozen-lockfile`, which is what CI runs: it re-validates the lockfile against the gate and fails with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` on any unexcluded immature version.
- Tests still import from `vite-plus/test`. Browser-mode providers are **opt-in peers**: `@vitest/browser-playwright` (its `playwright` peer is installed too), imported from `vite-plus/test/browser-playwright`. Keep provider and coverage package versions aligned to the catalog's bundled Vitest pin.
- The project uses stable TypeScript 7; read its pin from `package.json`. `vp exec tsc -b` checks the solution projects, while `vp check` uses tsgolint. Each `pack[]` entry explicitly pairs `tsconfig: "tsconfig.lib.json"` with `dts: { generator: "tsgo" }` so native declaration emission uses the library's leaf project. The bundled declaration plugin can infer `tsgo` for TS 7, but keep the explicit configuration for clarity. TypeScript 7's programmatic API is still experimental; the pack warning concerns that API, not the stability of the compiler release. Validate declaration changes with `vp pack` (including publint/ATTW), not type checking alone.
- VS Code needs the TypeScript 7 extension (`TypeScriptTeam.native-preview`) and **TypeScript: Enable TypeScript 7** for the native language service. `js/ts.tsdk.path` selects the workspace package but does not enable the service. The workspace recommends that extension and the Vite Plus Extension Pack; see `CONTRIBUTING.md` for setup.

## Codebase Structure

```
src/
├── index.ts                    # Root package API. Modular — does NOT side-effect-import "echarts" (legacy `/core` subpath was removed in v3); optional registry/preset APIs stay on their own subpaths
├── preset-full.ts              # `registerEchartsFull()` sugar — one-call namespace-spread of echarts/charts + components + renderers + features, registered via `echarts.use(...)`. Explicit opt-in to the full registry.
├── components/EChart.tsx       # Declarative component wrapping useEcharts
├── hooks/
│   ├── use-echarts.ts          # Orchestrator hook (zero effects of its own; delegates to internal hooks)
│   ├── use-lazy-init.ts        # IntersectionObserver hook — public `useLazyInit(options) → { ref, isInView }` callback-ref shape, plus the internal `useLazyInitForElement(element, options) → boolean` that `useEcharts` uses (it owns the container element itself)
│   └── internal/
│       ├── use-chart-core.ts   # Core: instance lifecycle + option sync + event rebinding + loading + group (6 effects); exposes the imperative API (setOption, dispatchAction, clear, resize, appendData, getOption, getDataURL, convertToPixel, …) and a reactive `instance` field
│       ├── use-resize-observer.ts # ResizeObserver auto-resize + visibilitychange resync (1 effect; onError reached via useEffectEvent)
│       └── event-utils.ts      # Pure functions: bindEvents / unbindEvents / eventsEqual
├── themes/
│   ├── index.ts                # Lightweight theme utilities (no JSON); registry state lives on a `globalThis` key so duplicate module copies share one registration record; FIFO contentHashCache for custom themes
│   ├── registry.ts             # Built-in theme registration (imports JSON)
│   └── presets/                # Built-in theme JSON (light/dark/macarons)
├── utils/
│   ├── instance-cache.ts       # WeakMap instance cache + reference counting (warns on mismatched setCachedInstance)
│   ├── connect.ts              # Chart group linkage logic (one connect() per groupId; disconnect when last member leaves)
│   ├── shallow-equal.ts        # Shallow equality for setOptionOpts / loadingOption deduplication
│   ├── stable-key.ts           # JSON.stringify-based dependency keys (non-canonical: property order affects the key; per-reference id fallback only when serialization throws; non-throwing results pass through)
│   ├── merge-refs.ts           # Compose multiple refs (RefObject / RefCallback / React 19 cleanup-callback) into one callback ref; per-ref try/catch isolation
│   ├── error.ts                # Imperative-path error routing helper (`routeImperativeError`)
│   ├── dev-warnings.ts         # Shared dev-mode warning sets (unknown theme, zero-size container, missing ECharts registration)
│   └── visibility-coordinator.ts # Module-level `document.visibilitychange` coordinator — single shared DOM listener serving all charts (`subscribeVisibilityResume`); attaches on first subscriber, detaches on last
├── types/index.ts              # All type definitions
└── __tests__/                  # Mirror structure: components/, hooks/, themes/, types/, utils/ + browser/ (real-chromium smoke tests) + top-level helpers.ts and preset-full.test.ts
```

## Architecture

### Hook Decomposition

All instance-related state lives in `useChartCore`; the orchestrator (`useEcharts`) has zero effects of its own. Effects are described by responsibility — there is no global numbering, since adding/removing one shouldn't shift the others' identities.

**`useChartCore`** — six effects, grouped by what they keep in sync. Initial application is bundled inside the lifecycle effect; the others handle dynamic post-init changes.

- **Ref Sync** (`useLayoutEffect`, no deps) — sync the typed `latestRef` (one `ImperativeLatest` object holding `setOptionOpts` and `onError`) every render. Only the imperative API (`withInstance` inside `useMemo`) reads via this ref, since `useEffectEvent` is forbidden outside effects. Effect-context error routing uses `useEffectEvent` directly (no ref); the 8 other config fields are captured by closure inside the lifecycle effect or flow as deps to their owning sync effect.
- **Instance Lifecycle** (`useLayoutEffect`) — create/dispose instance, apply initial option, events, loading, group. Emits the three dev-only warnings: zero-size container, one element shared by multiple hooks, and the `"… is not a constructor"` missing-registration hint (routed _alongside_ the real error, not instead of it). Re-runs on `shouldInit` plus the structural deps (`element` / `themeKey` / `renderer` / `initOptsKey`) — non-structural config is captured at init and kept current by the sync effects below.
- **Option Sync** (`useEffect`) — a new option reference always calls `setOption`; stable option references dedup when `setOptionOpts` is reference- or shallow-equal via `lastAppliedRef`.
- **Event Rebinding** (`useEffect`) — unbind old, bind new when `onEvents` changes (via `lastBoundRef` + `eventsEqual`; treats empty/undefined as equivalent).
- **Loading Toggle** (`useEffect`) — toggle `showLoading` / `hideLoading` on dynamic changes (dedup via `lastLoadingRef` + `shallowEqual` on `loadingOption`).
- **Group Switch** (`useEffect`) — switch chart group dynamically via `updateGroup`, deduped against `lastGroupRef` (the group _this hook_ last assigned) rather than the live `instance.group`, which is writable at runtime and would desync `groupMembers` bookkeeping if a consumer mutated it.

**`useResizeObserver`** — one effect.

- **Resize Observer** (`useEffect`) — create/destroy ResizeObserver with RAF throttle; also subscribes to a foreground resync via `subscribeVisibilityResume` (from `utils/visibility-coordinator.ts`) so the chart re-resizes when the tab returns to foreground (RAF is throttled in hidden tabs). The coordinator owns a single shared `document.visibilitychange` listener for all charts rather than one listener per instance. Latest `onError` is reached via `useEffectEvent` (no separate ref-sync effect).

### Key Design Patterns

- Callback-ref API — `useEcharts` owns the container ref internally: a `useCallback` callback ref + `useState<HTMLDivElement | null>` writes the live element into hook state, then the React 19 ref-cleanup return path clears it on unmount. Consumers receive a stable `ref` field and attach it to their container `<div ref={ref}>`. DOM-node replacement is detected because the ref-callback identity is stable while React itself fires `ref(newNode)` + cleanup with the old node.
- `useChartCore` owns all shared state internally — `lastAppliedRef`, `lastBoundRef`, `lastLoadingRef`, `lastGroupRef`, and the typed `latestRef` never leak to callers
- `useChartCore(element, shouldInit, config)` — 3-parameter API; takes the resolved element (not a ref) so DOM-node replacement re-triggers the lifecycle effect
- WeakMap instance cache + reference counting — safe under StrictMode (instance recreated cleanly; refCount prevents premature disposal when multiple consumers share an element)
- initOpts / theme serialized to dependency keys via `computeStableKey` — `JSON.stringify`-based and non-canonical, so property insertion order affects the key. Only serialization that throws falls back to a per-reference id; a non-throwing result (including `undefined` from a custom `toJSON`) passes through. Nullish or unsupported primitives (e.g. boolean/symbol) return `null`, while strings and numbers pass through. Each key is memoized via `useMemo` on the raw input ref (React Compiler skips this hook, so the calls aren't auto-memoized — see `src/hooks/internal/use-chart-core.ts`)
- Two-level theme cache — custom theme objects auto-deduplicated; `contentHash` param avoids double JSON.stringify; `contentHashCache` is a FIFO with a 100-entry cap
- Errors from `init` / `setOption` / `dispatchAction` / `resize` / event-bind / `showLoading` / group ops (`updateGroup` → `connect` / `disconnect`) route through the shared `onError` callback (or fall back to `console.error` / re-throw); cleanup-path `off` (unbind) and `dispose` (release) are try/caught too, so an effect-cleanup throw can't disrupt React commit. The lone deliberately-bare call is `off()` in the Event-Rebinding effect (see its inline comment — a same-handler rebind must unbind before binding). Effect-context errors flow through `useEffectEvent` for always-latest `onError`; imperative-API errors flow through `latestRef.current.onError` because `useEffectEvent` cannot be called outside Effects.
- `shallowEqual` on `setOptionOpts` / `loadingOption` — avoids redundant calls when wrapper objects contain the same shallow values; option data itself remains reference-driven
- `eventsEqual` on event rebinding — avoids unnecessary unbind/rebind when inline event objects have identical handlers
- `setOption` / `showLoading` / `updateGroup` attempts are recorded into `lastAppliedRef` / `lastLoadingRef` / `lastGroupRef` via `try/finally` even on failure — Option-Sync / Loading-Toggle / Group-Switch dedup against the same input pair instead of replaying a known-bad call and double-firing `onError` (for groups it also avoids `removeFromGroup`-ing a stale id after a partial move)
- Memoized return value — **neither `useChartCore` nor `useEcharts` is compiler-cached**, so both memoize by hand: `useChartCore` wraps its imperative API in `useMemo([element])` and merges the reactive instance via `useMemo([liveInstance, api])`; `useEcharts` then wraps the merge with `ref` in `useMemo([ref, chart])`. That last one is load-bearing — returning a bare `{ ref, ...chart }` literal discards the stability `useChartCore` just established and re-runs a consumer's `useImperativeHandle` / effect deps on every render (it also left `<EChart>`'s compiled `chart` memo slot permanently missing, surfacing as one unreachable branch in coverage). Only `useLazyInit` and `EChart` carry compiler-generated `c(N)` caches — check with `grep -n 'c([0-9]' dist/index.js` after `vp pack`, not against the source, and re-check after touching any hook's return
- React Compiler uses `@vitejs/plugin-react` + `@rolldown/plugin-babel` (`reactCompilerPreset()`) in the top-level `plugins` (dev/build) and two `pack[]` entries (index and preset-full). **Native compiler follow-up, checked against the installed toolchain on 2026-09-09:**
  - The installed `@vitejs/plugin-react` supports experimental `react({ compiler: true })` through its optional `oxc-transform-react` peer (`^0.145.0`; do not assume the latest 0.x package satisfies that range). That config applies to the Vite app pipeline; it does not configure the separate `pack[]` builds.
  - The bundled tsdown 0.23 configuration has no dedicated React Compiler option, and its Rolldown transform types do not expose `reactCompiler`. A virtual JSX probe with an untyped `transform.reactCompiler: true` produced no memo runtime and no warning; do not treat acceptance of an unknown option as compiler support. Keep Babel until a supported integration covers both the app and library builds, then verify the emitted memo caches, tests, and package output before removing the Babel dependencies.
  - Historical experiment (2026-08-26, `oxc-transform-react@0.147.0`): the native compiler compiled the files Babel compiled plus `useEcharts`, and skipped the same eslint-suppressed hooks. These results need to be repeated for any adopted compiler version; they are not validation of the current build.
- `<EChart>` imperative handle exposes `EChartHandle = Omit<UseEchartsReturn, "ref">` — `ref` is intentionally stripped so external callers cannot reassign the container via `handle.ref(otherNode)`

## Testing

- Two Vitest projects (`test.projects` in `vite.config.ts`, whose comments describe each project's scope): **`unit`** — happy-dom + ECharts API fully mocked; **`browser`** — real chromium via `@vitest/browser-playwright` (`src/__tests__/browser/**`) for what happy-dom can't simulate. Smoke level: assert effects are observable, not exact frame counts.
- Install the Chromium binary before local browser or all-project runs: `vp exec playwright install chromium` (use `--with-deps` on Linux/CI).
- Shared mocks in `src/__tests__/helpers.ts`: `createMockInstance`, `MockResizeObserver`, `MockIntersectionObserver`; import test APIs from `"vite-plus/test"` (`globals: true`)
- Coverage thresholds are enforced (v8: 95% statements/functions/lines, 90% branches); `vp test --coverage --project unit` exits non-zero when unmet, matching CI. Source sits at 100% today, so the gap is deliberate headroom for churn — not a licence to land uncovered code

### Test Gotchas

- In unit/happy-dom tests, `vi.mock("echarts/core")` before importing modules that depend on ECharts; browser tests intentionally import and register real ECharts modules
- Mock instance shape must match `createMockInstance` from helpers
- `MockIntersectionObserver.observe` triggers callback immediately with `isIntersecting: true`

## Conventions

- **Commit format:** `feat|fix|docs|test|refactor|chore: <subject>`
- **Types-first:** define types in `src/types/index.ts` before implementing
- **Resource cleanup:** effects that create subscriptions, listeners, observers, timers/RAFs, or other persistent resources must return paired cleanup; state/config synchronization effects need no cleanup when they acquire no resource
- **ECharts registration is the consumer's responsibility** — this library does NOT auto-register charts/components/renderers/features. Apps call `registerEchartsFull()` (from `react-use-echarts/preset-full`) for the everything-included path, or `echarts.use([...])` selectively. Mirrors `vue-echarts` / `nuxt-echarts` / `react-chartjs-2`. See `src/preset-full.ts` for the why.

## Anti-patterns

- **DO NOT** leave subscriptions, listeners, observers, timers/RAFs, or other persistent resources created by an effect without paired cleanup; synchronization-only effects are exempt
- **DO NOT** mutate `theme` or `initOpts` objects in place; distinct objects dedup only when their `JSON.stringify` output matches (property order affects the key), while memoization avoids repeated serialization
- **DO NOT** duplicate API reference from `README.md` into this file
- **DO NOT** re-add the removed `react-use-echarts/core` subpath — v3 consumers should import from `react-use-echarts`.
- **DO NOT** re-add `import "echarts"` to `src/index.ts` — the root entry must stay modular and must not force the full ECharts registry into every consumer bundle. Registration belongs in consumer-side code (their app entry or `registerEchartsFull()`).
- **DO NOT** import from `vitest` in tests or add `@voidzero-dev/vite-plus-test`. The `vitest` package is present only as an exact Vite+ catalog/override pin so Vite+ internals and opt-in providers share the bundled runner copy.

## Troubleshooting

| Problem                                                              | Cause                                                                     | Fix                                                                                                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Unit test fails: "echarts not mocked"                                | Missing `vi.mock("echarts/core")`                                         | Add mock before imports; browser tests use real registered ECharts modules                                                            |
| Test lint errors                                                     | `tsconfig.test.json` not correct                                          | Check `include` patterns                                                                                                              |
| `vp pack`: `tsgo did not generate dts file for …`                    | A `pack[]` entry lost its TS 7 dts settings                               | Every `pack[]` entry in `vite.config.ts` needs `tsconfig: "tsconfig.lib.json"` + `dts: { generator: "tsgo" }`                         |
| StrictMode double-mount issues                                       | Instance cache refCount mismatch                                          | Check `src/utils/instance-cache.ts` logic                                                                                             |
| `TypeError: ka[a] is not a constructor` at first `useEcharts()` init | App forgot to register charts/renderers                                   | Call `registerEchartsFull()` at app entry, or `echarts.use([...])` selectively before render                                          |
| `vp test`: `Could not find 'vitest' bin entry`                       | Stale `vitest`/`vite-plus-test` alias or mismatched catalog/override pins | Rerun `vp migrate --no-interactive`, keep tests on `vite-plus/test`, and verify `vp --version` bundled Vitest matches the catalog pin |
