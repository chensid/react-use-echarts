# react-use-echarts

> [中文](./README-zh_CN.md) | [English](./README.md)

[![NPM version](https://img.shields.io/npm/v/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![NPM downloads](https://img.shields.io/npm/dm/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![CI](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml/badge.svg)](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/chensid/react-use-echarts/graph/badge.svg)](https://codecov.io/gh/chensid/react-use-echarts)
[![GitHub issues](https://img.shields.io/github/issues/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/pulls)
[![GitHub license](https://img.shields.io/github/license/chensid/react-use-echarts.svg)](https://github.com/chensid/react-use-echarts/blob/main/LICENSE.txt)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/react-use-echarts?label=minzipped)](https://bundlephobia.com/package/react-use-echarts)
[![types included](https://img.shields.io/npm/types/react-use-echarts)](https://www.npmjs.com/package/react-use-echarts)

React hooks & component for Apache ECharts — TypeScript, auto-resize, themes, lazy init.

**[📊 Live demo & interactive playground →](https://chensid.github.io/react-use-echarts/)**

[![react-use-echarts — the minimal hook for Apache ECharts](https://raw.githubusercontent.com/chensid/react-use-echarts/main/.github/assets/hero.webp)](https://chensid.github.io/react-use-echarts/)

## Features

- **Hook + Component** — use `useEcharts` hook or the declarative `<EChart />` component
- **TypeScript first** — complete type definitions with IDE autocomplete
- **Zero dependencies** — no runtime deps beyond peer deps
- **Auto-resize** — handles container resizing via ResizeObserver
- **Themes** — built-in light, dark, and macarons themes, plus any custom theme
- **Chart linkage** — connect multiple charts for synchronized interactions
- **Lazy initialization** — defer chart init until element enters viewport
- **StrictMode safe** — instance cache with reference counting handles double mount/unmount

## Why react-use-echarts?

A modern, hook-first wrapper for teams on **React 19 + ECharts 6**. ECharts stays the single source of truth — you pass `EChartsOption` straight through, with no abstraction layer to re-learn.

|               | react-use-echarts                                | echarts-for-react        |
| ------------- | ------------------------------------------------ | ------------------------ |
| API           | `useEcharts` hook **and** `<EChart />` component | Component only           |
| Built for     | React 19 — callback ref, StrictMode-safe         | React 16–18 era          |
| Auto-resize   | `ResizeObserver` + RAF, on by default            | ✓                        |
| Lazy init     | Built-in `lazyInit` (IntersectionObserver)       | Manual                   |
| Chart linkage | Built-in `group` prop                            | Manual `echarts.connect` |
| Error routing | `onError` for init / setOption / dispatch        | Manual try/catch         |
| Format & deps | ESM-only, tree-shakeable, zero runtime deps      | CJS + ESM, zero deps     |

Already using `echarts-for-react`? Most props map 1:1 — see [Migrating from echarts-for-react](#migrating-from-echarts-for-react).

## Requirements

- React 19.2+ (`react` + `react-dom`) — `useEffectEvent` is used internally and reached stable in 19.2
- ECharts 6.x
- Node.js 22+ (required only for tooling/SSR frameworks — the published bundle is browser ESM)

> **CSR only.** ECharts needs a live DOM; SSR is not supported.
>
> **ESM-only since 1.3.0.** The package publishes a single ESM build (`dist/index.js`). Every modern bundler (Vite, Next.js, webpack 5+, Rspack, Parcel, Turbopack) and Node 22+ (`require(ESM)`) consume it natively. If you still depend on CJS-only tooling, pin to `1.2.x`.

## Installation

```bash
npm install react-use-echarts echarts
# or
yarn add react-use-echarts echarts
# or
pnpm add react-use-echarts echarts
```

## Register ECharts modules

Since v2.1 `react-use-echarts` is fully modular — it does not auto-register any ECharts chart, component, renderer or feature. Call one of the registrars below **once at your application entry**, before the first chart renders:

```ts
// Simplest — registers everything ECharts ships with (~290KB gzip).
import { registerEchartsFull } from "react-use-echarts/preset-full";
registerEchartsFull();
```

Or, for tree-shake-friendly production builds, register only what you actually render — see [Tree-shaking](#tree-shaking) for the recipe.

> **Why?** Production minifiers (Rolldown/Oxc, Rollup) drop ECharts' top-level `use([...])` side-effect registrations as pure because the upstream package's `sideEffects` field is non-conforming. Moving registration to the consumer side mirrors what `vue-echarts`, `nuxt-echarts` and `react-chartjs-2` do, and keeps `react-use-echarts` reliable across every modern bundler.

## Quick Start

### `<EChart />` Component

The simplest way — no ref needed:

```tsx
import { EChart } from "react-use-echarts";

function MyChart() {
  return (
    <EChart
      option={{
        xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
        yAxis: { type: "value" },
        series: [{ data: [150, 230, 224, 218, 135], type: "line" }],
      }}
    />
  );
}
```

`<EChart />` defaults to `width: 100%` and `height: 100%`, so the parent container still needs an explicit height.

Pass `ref` to access the imperative API — see [Returns](#returns) for the full list (`setOption`, `dispatchAction`, `clear`, `resize`, `appendData`, `getDataURL`, `convertToPixel`, …).

### `useEcharts` Hook

For full control, use the hook directly. It returns a callback `ref` to attach to your container plus a reactive `instance` field and the full imperative API:

```tsx
import { useEcharts } from "react-use-echarts";

function MyChart() {
  const { ref, instance, setOption, resize } = useEcharts({
    option: { series: [{ type: "line", data: [150, 230, 224, 218, 135] }] },
  });
  return <div ref={ref} style={{ width: "100%", height: "400px" }} />;
}
```

`instance` is `undefined` before init and after dispose; subscribe via `useEffect([instance])` to run side effects against the live ECharts instance.

The chart container must have an explicit size, for example `style={{ width: "100%", height: "400px" }}`.

## Recipes

### Themes

Built-in themes require one-time registration at app startup:

```tsx
import { registerBuiltinThemes } from "react-use-echarts/themes/registry";
registerBuiltinThemes();

// Built-in theme
useEcharts({ option, theme: "dark" });

// Any string registered via echarts.registerTheme
useEcharts({ option, theme: "vintage" });

// Custom theme object (use useMemo to keep reference stable)
const customTheme = useMemo(() => ({ color: ["#fc8452", "#9a60b4", "#ea7ccc"] }), []);
useEcharts({ option, theme: customTheme });
```

### Event Handling

Supports shorthand (function) and full config (object with query/context). Known echarts events have their `params` type auto-inferred from `EChartsEventPayloadMap` — no manual cast needed.

```tsx
useEcharts({
  option,
  onEvents: {
    // `params` is auto-typed as `ECElementEvent`
    click: (params) => console.log("clicked", params.data),
    mouseover: {
      handler: (params) => console.log("hovered", params.value),
      query: "series",
    },
    // `params` is auto-typed as `SelectChangedPayload`
    selectchanged: (params) => console.log("selection changed", params),
  },
});
```

Custom event names (e.g. registered via `echarts.registerAction()`) fall through to the open index signature with a loose `params` type. To get a typed payload for your own events, augment `EChartsEventPayloadMap`:

```ts
declare module "react-use-echarts" {
  interface EChartsEventPayloadMap {
    "my-custom-action": { foo: number; bar: string };
  }
}
```

### Loading State

```tsx
const [loading, setLoading] = useState(true);

useEcharts({
  option,
  showLoading: loading,
  loadingOption: { text: "Loading..." },
});
```

### Chart Linkage

Assign the same `group` ID — tooltips, highlights, and other interactions will sync:

```tsx
useEcharts({ option: option1, group: "dashboard" });
useEcharts({ option: option2, group: "dashboard" });
```

### Lazy Initialization

Defer chart init until the element scrolls into view:

```tsx
useEcharts({ option, lazyInit: true });

// Custom IntersectionObserver options
useEcharts({
  option,
  lazyInit: { rootMargin: "200px", threshold: 0.5 },
});
```

### Tree-shaking

The library is fully modular — pick the registration tier that matches your build target:

**Tier 1 — All-in-one (development / prototyping).** One line, ~290KB gzip:

```ts
import { registerEchartsFull } from "react-use-echarts/preset-full";
registerEchartsFull();
```

**Tier 2 — Selective (recommended for production).** Register only what you render — bundlers tree-shake the rest of ECharts away:

```ts
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);
```

See [`examples/core-entry/CoreEntryChart.tsx`](./examples/core-entry/CoreEntryChart.tsx) for a runnable demo.

**Tier 3 — Webpack-only legacy.** Webpack tolerates ECharts' non-conforming `sideEffects` field, so plain `import "echarts";` still works in webpack apps but **fails silently under Rolldown/Vite/Rollup** (chart never paints, console shows `TypeError` from zrender's empty painter registry). Prefer Tier 1 or Tier 2 instead.

> ECharts maintains a single global registry — `echarts.use([...])` and `registerEchartsFull()` compose freely. You can call them in any order, anywhere in your app, but they must run **before** the first `useEcharts()` render.

### Use with Next.js (App Router)

The package entry and `themes/registry` are marked with `"use client"`, so
importing them inside any React Server Component file does **not** bundle
ECharts into the server payload. Wrap the chart in your own client
component and import it from any Server Component:

```tsx
// app/components/MyChart.tsx
"use client";
import { EChart } from "react-use-echarts";

export function MyChart() {
  return <EChart option={{ series: [{ type: "line", data: [1, 2, 3] }] }} />;
}
```

```tsx
// app/page.tsx (Server Component) — imports the Client Component directly
import { MyChart } from "./components/MyChart";

export default function Page() {
  return <MyChart />;
}
```

> **Pages Router only:** if you need to load the chart inside `getServerSideProps` /
> `getStaticProps` pages and force client-only rendering, use
> `dynamic(() => import("./components/MyChart").then((m) => m.MyChart), { ssr: false })`.
> In the **App Router**, `next/dynamic` with `ssr: false` is disallowed inside
> Server Components — the `"use client"` directive already does the right thing.

## Gotchas

- **Container needs explicit size** — the chart won't render in a zero-height div; give the container `height` (and `width` if not 100%).
- **Forgetting to register ECharts modules** — `useEcharts()` initializes a chart against ECharts' shared global registry, so charts/components/renderers/features must be registered (via `registerEchartsFull()` or `echarts.use([...])`) **before** the first render. A missing registration usually shows up as `Renderer 'undefined' is not imported` or a chart that silently never paints; see [Register ECharts modules](#register-echarts-modules). In dev, if init throws `… is not a constructor`, the library also prints a one-time hint pointing you here.
- **Keep `onEvents` reference stable** — a new `onEvents` object on each render triggers a full rebind. Memoize it with `useMemo` (or hoist) when handlers don't change.
- **Don't share one DOM element across multiple `useEcharts` hooks** — the instance cache reuses a single ECharts instance and emits a dev warning; updates from different hooks will overwrite each other.
- **`initOpts` and custom `theme` objects recreate the instance on reference change** — pass memoized or module-level constants unless recreation is intended.
- **StrictMode is safe** — double mount/unmount is handled by the reference-counted instance cache.

## API Reference

### `<EChart />` Props

Declarative component wrapping `useEcharts`. Accepts all hook options as props plus:

| Prop        | Type                  | Default                             | Description                                                                                                                      |
| ----------- | --------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `style`     | `React.CSSProperties` | `{ width: '100%', height: '100%' }` | Container style (merged with defaults)                                                                                           |
| `className` | `string`              | —                                   | Container CSS class                                                                                                              |
| `ref`       | `Ref<EChartHandle>`   | —                                   | Exposes the imperative API as `EChartHandle` (`Omit<UseEchartsReturn, 'ref'>` — the container ref is owned by `<EChart>` itself) |

### `useEcharts(options)`

#### Options

| Option          | Type                                  | Default    | Description                                                                                                     |
| --------------- | ------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `option`        | `EChartsOption`                       | (required) | ECharts configuration                                                                                           |
| `theme`         | `string \| object`                    | —          | Any registered theme name, or custom theme object                                                               |
| `renderer`      | `'canvas' \| 'svg'`                   | `'canvas'` | Renderer type                                                                                                   |
| `lazyInit`      | `boolean \| IntersectionObserverInit` | `false`    | Lazy initialization via IntersectionObserver                                                                    |
| `group`         | `string`                              | —          | Chart linkage group ID                                                                                          |
| `setOptionOpts` | `SetOptionOpts`                       | —          | Default options for `setOption` calls                                                                           |
| `showLoading`   | `boolean`                             | `false`    | Show loading indicator                                                                                          |
| `loadingOption` | `object`                              | —          | Loading indicator configuration                                                                                 |
| `onEvents`      | `EChartsEvents`                       | —          | Event handlers (`fn` or `{ handler, query?, context? }`)                                                        |
| `autoResize`    | `boolean`                             | `true`     | Auto-resize via ResizeObserver                                                                                  |
| `initOpts`      | `EChartsInitOpts`                     | —          | Passed to `echarts.init()` (devicePixelRatio, locale, width, etc.)                                              |
| `onError`       | `(error: unknown) => void`            | —          | Error handler — effect failures logged via `console.error` without it; imperative `setOption` throws without it |

#### Returns

> Prefer the declarative props (`option`, `theme`, `showLoading`, …) over imperative methods. Use these methods only when a prop does not cover the action — image export, coordinate conversion, streaming append, etc.
> All methods are no-ops or return safe defaults when the instance is not yet initialized. When the instance throws, errors are routed through `onError` if provided (and the call returns the fallback); otherwise the error is rethrown — including from readers (no `console.error` fallback for imperative methods).

**Container ref / live instance**

| Property   | Type                          | Description                                                                                                                                              |
| ---------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `RefCallback<HTMLDivElement>` | Callback ref to attach to the chart container. Compose with your own ref via [`mergeRefs`](#other-exports)                                               |
| `instance` | `ECharts \| undefined`        | Reactive — defined after init, `undefined` before init and after dispose. Subscribe via `useEffect([instance])` to run side effects on the live instance |

**Lifecycle / updates**

| Method           | Type                                                                                 | Description                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setOption`      | `(option: EChartsOption, opts?: SetOptionOpts) => void`                              | Update chart configuration                                                                                                                            |
| `dispatchAction` | `(payload: Payload, opt?: boolean \| { silent?: boolean; flush?: boolean }) => void` | Dispatch an ECharts action (`highlight`, `downplay`, `showTip`, etc.)                                                                                 |
| `clear`          | `() => void`                                                                         | Clear current chart content                                                                                                                           |
| `resize`         | `(opts?: ResizeOpts) => void`                                                        | Manually trigger chart resize. `ResizeOpts` accepts `width`/`height`/`animation`/`silent`                                                             |
| `appendData`     | `(params: { seriesIndex: number; data: ArrayLike<unknown> }) => void`                | Append data to a series (streaming). Drift-aware: drops dedup memory so a subsequent shallow-equal-but-new-ref `option` rerender re-applies setOption |

**Read / introspect**

| Method       | Type                               | Description                                                                              |
| ------------ | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `getOption`  | `() => EChartsOption \| undefined` | Get the current merged option                                                            |
| `getWidth`   | `() => number \| undefined`        | Container width in pixels                                                                |
| `getHeight`  | `() => number \| undefined`        | Container height in pixels                                                               |
| `getDom`     | `() => HTMLElement \| undefined`   | Underlying DOM container                                                                 |
| `isDisposed` | `() => boolean`                    | Whether the instance is disposed (returns `true` when uninitialized — semantically gone) |

**Export**

| Method                | Type                                                       | Description                                              |
| --------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| `getDataURL`          | `(opts?) => string \| undefined`                           | Base64 image data URL (`png` / `jpeg` / `svg`)           |
| `getConnectedDataURL` | `(opts?) => string \| undefined`                           | Combined image of all charts in the same group           |
| `renderToSVGString`   | `(opts?: { useViewBox?: boolean }) => string \| undefined` | Render chart to SVG string (works with the SVG renderer) |
| `getSvgDataURL`       | `() => string \| undefined`                                | Get SVG data URL of the current chart                    |

**Coordinate conversion**

| Method             | Type                                                                                                    | Description                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `convertToPixel`   | `(finder: ChartFinder, value: ChartScaleValue \| ChartScaleValue[]) => number \| number[] \| undefined` | Logical → pixel coordinates                                               |
| `convertFromPixel` | `(finder: ChartFinder, value: number \| number[]) => number \| number[] \| undefined`                   | Pixel → logical coordinates                                               |
| `containPixel`     | `(finder: ChartFinder, value: number[]) => boolean`                                                     | Whether a pixel point is inside the matched component (false when uninit) |

`ChartFinder` is `string | { seriesIndex?, seriesId?, …, geoIndex?, … }` — a string shorthand or a model finder object. `ChartScaleValue` is `number | string | Date`.

### Other Exports

```tsx
import { useLazyInit } from "react-use-echarts"; // standalone lazy init hook -> { ref, isInView }
import { mergeRefs } from "react-use-echarts"; // compose multiple refs into one callback ref
import { isBuiltinTheme, registerCustomTheme } from "react-use-echarts"; // theme utils (no JSON)
import { registerBuiltinThemes } from "react-use-echarts/themes/registry"; // ~20KB theme JSON
import { registerEchartsFull } from "react-use-echarts/preset-full"; // one-line full-set registrar (see Register ECharts modules)

// All exported types: UseEchartsOptions, UseEchartsReturn, UseLazyInitReturn,
// EChartProps, EChartHandle, EChartsEvents, EChartsEventConfig, EChartsEventHandler,
// EChartsEventPayloadMap, EChartsInitOpts, BuiltinTheme, LoadingOption,
// ChartFinder, ChartScaleValue, Payload.
// EChartsOption, SetOptionOpts, ResizeOpts are also re-exported here for
// convenience (they originate in the "echarts" package), so you can import them
// from react-use-echarts alongside the types above instead of reaching into echarts.
```

> `react-use-echarts/core` is a deprecated alias of the default entry as of v2.1 — both are now identical modular entries. The `/core` alias will be removed in v4; migrate any `from "react-use-echarts/core"` imports to `from "react-use-echarts"`.

`mergeRefs` returns a callback ref that fans the node out to every input — `RefObject`, legacy callback ref, or React 19 callback ref with cleanup — and isolates each invocation so a throwing 3rd-party ref can't strand the chart. Reach for it when you need both the hook-provided ref and your own:

```tsx
const myRef = useRef<HTMLDivElement>(null);
const { ref } = useEcharts({ option });
return <div ref={mergeRefs(ref, myRef)} style={{ height: 400 }} />;
```

## Migrating from `echarts-for-react`

Most props map 1:1; a few are folded into existing options. Quick reference:

| `echarts-for-react`       | `react-use-echarts`                       | Notes                                                                                                                                                                                  |
| ------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `option`                  | `option`                                  | Same                                                                                                                                                                                   |
| `theme`                   | `theme`                                   | Same; built-in themes need `registerBuiltinThemes()` first (see [Themes](#themes))                                                                                                     |
| `notMerge` / `lazyUpdate` | `setOptionOpts: { notMerge, lazyUpdate }` | Folded into a single object passed to `setOption`                                                                                                                                      |
| `showLoading`             | `showLoading`                             | Same                                                                                                                                                                                   |
| `loadingOption`           | `loadingOption`                           | Same                                                                                                                                                                                   |
| `onEvents`                | `onEvents`                                | Same shape; also accepts `{ handler, query?, context? }` for query/context binding                                                                                                     |
| `onChartReady`            | Subscribe to the reactive `instance`      | `useEffect(() => { if (instance) onReady(instance); }, [instance])` — the returned `instance` is `undefined` before init and re-renders when init/dispose completes                    |
| `opts.renderer`           | `renderer: 'canvas' \| 'svg'`             | Promoted to a top-level option                                                                                                                                                         |
| `opts` (rest)             | `initOpts`                                | Same shape (`devicePixelRatio`, `locale`, `width`, `height`, `useDirtyRect`, etc.)                                                                                                     |
| `style`                   | `style`                                   | `<EChart />` defaults to `{ width: '100%', height: '100%' }` so the parent needs size                                                                                                  |
| `className`               | `className`                               | Same                                                                                                                                                                                   |
| `lazyUpdate` (top-level)  | `setOptionOpts: { lazyUpdate: true }`     | See `notMerge` row                                                                                                                                                                     |
| `shouldSetOption`         | Gate the `option` prop yourself           | Top-level keys are deduped via `shallowEqual` automatically; for custom predicates (deep compare, throttling, app-state gating) memoize/skip the `option` prop in the parent component |
| `autoResize` (4.x)        | `autoResize`                              | Same default (`true`); resize uses ResizeObserver + RAF                                                                                                                                |
| _none_                    | `lazyInit`                                | New: defer init until the container scrolls into viewport                                                                                                                              |
| _none_                    | `group`                                   | New: chart linkage via shared group ID                                                                                                                                                 |
| _none_                    | `onError`                                 | New: route init / setOption / dispatchAction errors through a callback                                                                                                                 |

Side-by-side example:

```tsx
// echarts-for-react
<ReactECharts
  option={option}
  theme="dark"
  notMerge
  lazyUpdate
  opts={{ renderer: "svg", devicePixelRatio: 2 }}
  onEvents={{ click: handleClick }}
  showLoading={loading}
  onChartReady={(instance) => instanceRef.current = instance}
/>

// react-use-echarts
<EChart
  ref={chartRef}
  option={option}
  theme="dark"
  setOptionOpts={{ notMerge: true, lazyUpdate: true }}
  renderer="svg"
  initOpts={{ devicePixelRatio: 2 }}
  onEvents={{ click: handleClick }}
  showLoading={loading}
/>
// chartRef.current?.instance replaces onChartReady
```

## Migrating from v2.0

v2.1 stops side-effect-importing `"echarts"` from the default entry — the library is now fully modular, matching `vue-echarts` / `nuxt-echarts` / `react-chartjs-2`. The hook/component API is unchanged; you only need to add **one line** at your application entry:

```ts
// app entry (e.g. main.tsx, index.tsx)
import { registerEchartsFull } from "react-use-echarts/preset-full";
registerEchartsFull();
```

That call is equivalent to v2.0's automatic `import "echarts"` and gives you the same ~290KB-gzip everything-included experience. For production builds that only render a few chart types, replace it with a selective `echarts.use([...])` — see [Tree-shaking](#tree-shaking).

The `react-use-echarts/core` subpath is deprecated as of v2.1 and now behaves identically to the default entry (both are modular). Existing `from "react-use-echarts/core"` imports keep working but will be removed in v4; migrate to the default entry at your convenience.

## Migrating from v1

v2.0 flips the hook to return a callback ref + reactive `instance`, aligning with the modern community convention used by `floating-ui/react`, `react-aria`, `downshift`, and `react-hook-form`. `<EChart />` external props are unchanged — only direct hook consumers and `<EChart ref>` typings migrate.

| v1                                               | v2                                                   | Notes                                                                                                                    |
| ------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `const ref = useRef(); useEcharts(ref, options)` | `const { ref } = useEcharts(options)`                | Hook owns the callback ref; attach it to your container                                                                  |
| `getInstance()` method on the hook return        | `instance` field on the same return                  | Reactive — re-renders when init/dispose completes; use `useEffect([instance])` to subscribe                              |
| `useLazyInit(ref, options)` returning `boolean`  | `useLazyInit(options)` returning `{ ref, isInView }` | Same callback-ref pattern                                                                                                |
| `useRef<UseEchartsReturn>(null)` for `<EChart>`  | `useRef<EChartHandle>(null)` for `<EChart>`          | `EChartHandle = Omit<UseEchartsReturn, 'ref'>` — the container ref is intentionally not exposed on the imperative handle |
| Compose refs by hand                             | `mergeRefs(chartRef, myRef)`                         | New public utility (see [Other Exports](#other-exports))                                                                 |
| `engines.node >=20`                              | `engines.node >=22`                                  | Tooling requirement only — published bundle is unaffected                                                                |

Side-by-side hook example:

```tsx
// v1
const chartRef = useRef<HTMLDivElement>(null);
const { setOption, getInstance } = useEcharts(chartRef, { option });
useEffect(() => {
  getInstance()?.on("finished", handler);
}, []);
return <div ref={chartRef} style={{ height: 400 }} />;

// v2
const { ref, instance, setOption } = useEcharts({ option });
useEffect(() => {
  if (!instance) return;
  instance.on("finished", handler);
  return () => instance.off("finished", handler);
}, [instance]);
return <div ref={ref} style={{ height: 400 }} />;
```

## Contributing

We welcome all contributions. Please read the [contributing guidelines](CONTRIBUTING.md) first.

## Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/chensid/react-use-echarts/releases).

## License

[MIT](./LICENSE.txt) © [Ethan](https://github.com/chensid)
