# react-use-echarts

## 2.1.4

### Patch Changes

- 1058e7d: Docs & npm metadata: add a README hero image, minzipped-size and types badges, a live-demo link, and an `echarts-for-react` comparison table. Point `homepage` at the live showcase and expand `keywords` for discoverability. No library code changes.

## 2.1.3

### Patch Changes

- 4f81046: robustness + perf + type hardening:
  - visibility-coordinator: isolate each `visibilitychange` subscriber in its own
    try/catch. The coordinator runs a single shared document listener for every
    chart, so a callback that throws (e.g. a consumer `onError` that rethrows from
    the resize path) previously aborted the loop and starved every later chart's
    foreground resize resync. Mirrors merge-refs' per-callback isolation.
  - event-utils: `eventsEqual` now uses a two-pass key walk (mirroring
    `shallowEqual`) instead of allocating a key-union `Set` per call. This path
    runs on every render when `onEvents` is an inline object literal, so the change
    removes a per-render allocation for charts with inline event handlers.
    Behavior is identical (verified by the existing eventsEqual suite).
  - types: `EChartsEventConfig`'s object form marks `handler` / `query` / `context`
    `readonly`, matching the library's `ReadonlyArray` / `ReadonlySet` house style.
    Compile-time only — no runtime or usage change.

  vp check + test green (100% coverage, 282 pass), attw/publint pass, size-limit under budget.

## 2.1.2

### Patch Changes

- eb111ad: Dev-mode console warnings are now strippable from consumer production bundles. The published entries (`index`, `core`, `preset-full`) preserve `process.env.NODE_ENV` instead of baking the library's build-time value, so each consumer's bundler dead-code-eliminates the dev-only warnings in their production build (~0.6 KB gzip) while keeping them in development. Also trims a per-render allocation in the chart hook's imperative-API ref sync, collapses the deprecated `core` entry to a thin re-export of the default entry, and removes an unused internal `isInGroup` helper. No public API changes.

## 2.1.1

### Patch Changes

- 01b0fd8: Maintenance release. Upgrade the Vite+ build toolchain 0.1.22 → 0.1.23 (Vite 8.0.14, Rolldown 1.0.3, Vitest 4.1.7, Oxlint 1.67, Oxfmt 0.52) and refresh dev dependencies (`@arethetypeswrong/cli`, `@babel/core`, `react-router-dom`). Internal-only changes: removed redundant type assertions in the imperative API (public types and runtime behavior unchanged), and added `promise`/`import` lint guards plus a coverage threshold gate. No changes to the published API or runtime output.

## 2.1.0

### ⚠️ Breaking change

- The default `react-use-echarts` entry no longer side-effect-imports `"echarts"`. Production minifiers (Rolldown/Oxc, Rollup) drop ECharts' ~36 top-level `use([...])` registrations as pure because the upstream package's `sideEffects` field is non-conforming — the bundled output ends up with an empty zrender painter registry and `new ECharts(…)` throws `TypeError: ka[a] is not a constructor` on first init. The library is now fully modular, matching `vue-echarts` / `nuxt-echarts` / `react-chartjs-2`. Consumers must register the modules they need **before** the first `useEcharts()` render.

  **Quickest migration** — equivalent to v2.0's automatic full-set registration, one line at app entry:

  ```ts
  import { registerEchartsFull } from "react-use-echarts/preset-full";
  registerEchartsFull();
  ```

  **Tree-shake-friendly migration** — selective registration, recommended for production:

  ```ts
  import * as echarts from "echarts/core";
  import { LineChart } from "echarts/charts";
  import { GridComponent, TooltipComponent } from "echarts/components";
  import { CanvasRenderer } from "echarts/renderers";
  echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);
  ```

  Hook / component / type API is unchanged.

### Minor Changes

- New subpath entry `react-use-echarts/preset-full` exporting `registerEchartsFull()` — a one-line registrar that calls `echarts.use(...)` with every built-in chart, component, renderer and feature. Drop-in replacement for v2.0's implicit `import "echarts"`, but as an explicit call so production minifiers preserve the registration chain.

- `react-use-echarts/core` is now a deprecated alias of the default entry. Both entries are identical (fully modular) since v2.1; `/core` will be removed in v4. Migrate `from "react-use-echarts/core"` imports to `from "react-use-echarts"` at your convenience.

- `package.json` `sideEffects` flipped from `["./dist/index.js"]` to `false`. The library is now fully tree-shakable — bundlers will no longer pull `dist/index.js` into the graph unless something is actually imported from it.

## 2.0.0

### Major Changes

- Callback-ref API. `useEcharts` now takes `(options)` only and returns `{ ref, instance, …imperativeAPI }`. Attach the returned `ref` to your container: `<div ref={ref} />`. The previous `useEcharts(refObject, options)` signature has been removed; there is no codemod.
  - `useLazyInit` mirrors the new shape: `useLazyInit(options) → { ref, isInView }`.
  - `instance` is now a reactive field — `useEffect([instance], …)` subscribes to the lifecycle of the underlying ECharts instance. `getInstance()` is removed.

- New utility `mergeRefs(...refs)` — composes `RefObject`, legacy callback refs, and React 19 cleanup-callback refs into one callback ref. Each ref invocation/cleanup runs in isolation; a throwing third-party ref cannot strand the chart.

- `<EChart>` imperative handle now exposes the new `EChartHandle` type (`Omit<UseEchartsReturn, "ref">`). The container `ref` field is intentionally stripped from the handle — external callers can no longer reassign the chart's DOM element via `handle.ref(otherNode)`. Migrate `useRef<UseEchartsReturn>(null)` to `useRef<EChartHandle>(null)` for `<EChart ref>`.

- Drops the internal `useRefElement` polling bridge in favor of React 19 callback-ref + state. One fewer effect, one fewer render on mount.

- Engines: requires Node `>=22`. React peer remains `^19.2.0`, ECharts peer remains `^6.0.0`. ESM-only (unchanged).

### Patch Changes

- `eventsEqual` now correctly handles `EChartsEvents` entries explicitly assigned `undefined` (the index signature is `EChartsEventConfig | undefined`) — previously crashed with `TypeError: Cannot read properties of undefined (reading 'handler')` when toggling an event between defined and undefined under the same key.
- `setOption` / `showLoading` lifecycle attempts now record `lastAppliedRef` / `lastLoadingRef` via `try/finally` even when ECharts throws, so the dedicated Option-Sync / Loading-Toggle useEffects don't immediately replay the same failing call on the same mount and fire `onError` twice.
- `useLazyInit` toggling `lazyInit` from `false` to `true` at runtime now correctly resumes observation (previously the initial `useState(!isLazyMode)` snapshot left visibility permanently `true`).

## 1.6.1

### Patch Changes

- 905ac53: Fix `sideEffects: false` causing bundlers to tree-shake `import "echarts"` from the default entry, leaving the global ECharts registry empty and producing `TypeError: xa[a] is not a constructor` (or similar) at `echarts.init`.

  Switch to a whitelist that preserves the side-effect import in `dist/index.js` (consumer-side) and `src/index.ts` (this repo's showcase). The `/core` and `/themes/registry` sub-entries remain fully tree-shakable since they're not in the whitelist.

  Regression introduced when `import "echarts"` was added to the default entry alongside the `/core` sub-entry without updating the package-level `sideEffects` field.

## 1.6.0

### Minor Changes

- 69ad0cc: Migrate internal effect-context error routing to React 19.2's stable `useEffectEvent`. The 10-field `LatestConfig` ref-sync bridge in `useChartCore` is replaced by direct closure capture for snapshot-at-init fields and `useEffectEvent` for cross-effect `onError` routing; only `setOptionOpts` and `onError` remain in a 2-field `ImperativeLatest` ref (used by the imperative API, which cannot call `useEffectEvent`). `useResizeObserver`'s `onErrorRef` is replaced by the same pattern.

  Bumps `react` peer dependency to `^19.2.0` (required for stable `useEffectEvent`).

  No public API change.

## 1.5.1

### Patch Changes

- e228774: Refresh dev toolchain — no runtime / API changes.
  - `@vitejs/plugin-react` → ^6.0.2
  - `react-router-dom` → ^7.15.1 (examples app only)
  - `@types/node` → ^25.8.0
  - `publint` → ^0.3.21

  Published bundle is bit-identical to 1.5.0; bump is purely to keep release cadence in sync with the upstream toolchain refresh.

## 1.5.0

### Minor Changes

- 20fd1d9: Add tree-shakable `react-use-echarts/core` subpath entry.

  The default entry now imports `"echarts"` as a side-effect to preserve its zero-config behavior (every chart and component pre-registered). The new `/core` entry skips that import, letting consumers register only the modules they need via `echarts.use([...])` for substantially smaller production bundles. Both entries share the same public API — only the import path differs.

  ```tsx
  import * as echarts from "echarts/core";
  import { LineChart } from "echarts/charts";
  import { GridComponent } from "echarts/components";
  import { CanvasRenderer } from "echarts/renderers";
  echarts.use([LineChart, GridComponent, CanvasRenderer]);

  import { useEcharts, EChart } from "react-use-echarts/core";
  ```

  This is fully backwards-compatible: the default entry's behavior is unchanged.

## 1.4.1

### Patch Changes

- b0b56dd: Document `EChartsEventHandler` and the re-exported `Payload` type in the README's "All exported types" comment. Both have been exported from the package since 1.4.0 (and earlier for `EChartsEventHandler`); only the inline reference list was missing them.

## 1.4.0

### Minor Changes

- 5e3f80a: Expand the imperative API surface and fix a `clear()` dedup regression.

  **New `useEcharts` return methods**
  - Lifecycle: `appendData(params)` (drift-aware — drops dedup memory so the next shallow-equal `option` rerender re-applies)
  - Read / introspect: `getOption()`, `getWidth()`, `getHeight()`, `getDom()`, `isDisposed()`
  - Export: `getDataURL(opts?)`, `getConnectedDataURL(opts?)`, `renderToSVGString(opts?)`, `getSvgDataURL()`
  - Coordinate conversion: `convertToPixel(finder, value)`, `convertFromPixel(finder, value)`, `containPixel(finder, value)`

  **Signature change**
  - `resize()` now accepts an optional `ResizeOpts` argument (`{ width?, height?, animation?, silent? }`) — passes through to ECharts' native `resize`.

  **Bug fix**
  - `clear()` now resets the internal `lastAppliedRef`. Without this, calling `clear()` and then rerendering with a shallow-equal-but-new-reference `option` would be silently skipped by the option-sync dedup and leave the chart blank.

  **New exported types**
  - `ChartFinder`, `ChartScaleValue` — convenience types for the coordinate-conversion methods.

  **Excluded from this batch (intentional, to avoid conflicts with declarative props)**
  - `dispose` (managed by hook lifecycle), `setTheme` (`theme` prop), `showLoading` / `hideLoading` (`showLoading` + `loadingOption` props), `getZr` / `renderToCanvas` / `getDevicePixelRatio` (low-frequency; reach for `getInstance()` if needed).
