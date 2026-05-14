# react-use-echarts

> [中文](./README-zh_CN.md) | [English](./README.md)

[![NPM version](https://img.shields.io/npm/v/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![NPM downloads](https://img.shields.io/npm/dm/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![CI](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml/badge.svg)](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/chensid/react-use-echarts/graph/badge.svg)](https://codecov.io/gh/chensid/react-use-echarts)
[![GitHub issues](https://img.shields.io/github/issues/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/pulls)
[![GitHub license](https://img.shields.io/github/license/chensid/react-use-echarts.svg)](https://github.com/chensid/react-use-echarts/blob/main/LICENSE.txt)

React hooks & component for Apache ECharts — TypeScript, auto-resize, themes, lazy init.

## Features

- **Hook + Component** — use `useEcharts` hook or the declarative `<EChart />` component
- **TypeScript first** — complete type definitions with IDE autocomplete
- **Zero dependencies** — no runtime deps beyond peer deps
- **Auto-resize** — handles container resizing via ResizeObserver
- **Themes** — built-in light, dark, and macarons themes, plus any custom theme
- **Chart linkage** — connect multiple charts for synchronized interactions
- **Lazy initialization** — defer chart init until element enters viewport
- **StrictMode safe** — instance cache with reference counting handles double mount/unmount

## Requirements

- React 19+ (`react` + `react-dom`)
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

For full control, use the hook directly:

```tsx
import { useRef } from "react";
import { useEcharts } from "react-use-echarts";

function MyChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const { setOption, getInstance, resize } = useEcharts(chartRef, {
    option: { series: [{ type: "line", data: [150, 230, 224, 218, 135] }] },
  });
  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
}
```

The chart container must have an explicit size, for example `style={{ width: "100%", height: "400px" }}`.

## Recipes

### Themes

Built-in themes require one-time registration at app startup:

```tsx
import { registerBuiltinThemes } from "react-use-echarts/themes/registry";
registerBuiltinThemes();

// Built-in theme
useEcharts(chartRef, { option, theme: "dark" });

// Any string registered via echarts.registerTheme
useEcharts(chartRef, { option, theme: "vintage" });

// Custom theme object (use useMemo to keep reference stable)
const customTheme = useMemo(() => ({ color: ["#fc8452", "#9a60b4", "#ea7ccc"] }), []);
useEcharts(chartRef, { option, theme: customTheme });
```

### Event Handling

Supports shorthand (function) and full config (object with query/context):

```tsx
useEcharts(chartRef, {
  option,
  onEvents: {
    click: (params) => console.log("Clicked:", params),
    mouseover: {
      handler: (params) => console.log("Hover:", params),
      query: "series",
    },
  },
});
```

### Loading State

```tsx
const [loading, setLoading] = useState(true);

useEcharts(chartRef, {
  option,
  showLoading: loading,
  loadingOption: { text: "Loading..." },
});
```

### Chart Linkage

Assign the same `group` ID — tooltips, highlights, and other interactions will sync:

```tsx
useEcharts(chartRef1, { option: option1, group: "dashboard" });
useEcharts(chartRef2, { option: option2, group: "dashboard" });
```

### Lazy Initialization

Defer chart init until the element scrolls into view:

```tsx
useEcharts(chartRef, { option, lazyInit: true });

// Custom IntersectionObserver options
useEcharts(chartRef, {
  option,
  lazyInit: { rootMargin: "200px", threshold: 0.5 },
});
```

### Tree-shaking with the `/core` Entry

The default `react-use-echarts` entry imports `"echarts"` for its side-effect registration of every chart and component, so users get a zero-config experience at the cost of bundling all of ECharts (~290KB gzip). For production apps that only render a handful of chart types, the `react-use-echarts/core` subpath skips that side-effect and lets you register exactly what you need:

```tsx
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

import { useEcharts, EChart } from "react-use-echarts/core";
// Same API as the default entry — only the import path differs.
```

The two entries share the same public API; pick `/core` when you want bundlers to tree-shake unused ECharts modules out of your final build. Built-in themes still work via `react-use-echarts/themes/registry`.

> ECharts maintains a single global registry, so `echarts.use([...])` calls compose across modules — call it once per chart type, anywhere in your app.

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
- **Keep `onEvents` reference stable** — a new `onEvents` object on each render triggers a full rebind. Memoize it with `useMemo` (or hoist) when handlers don't change.
- **Don't share one DOM element across multiple `useEcharts` hooks** — the instance cache reuses a single ECharts instance and emits a dev warning; updates from different hooks will overwrite each other.
- **`initOpts` and custom `theme` objects recreate the instance on reference change** — pass memoized or module-level constants unless recreation is intended.
- **StrictMode is safe** — double mount/unmount is handled by the reference-counted instance cache.

## API Reference

### `<EChart />` Props

Declarative component wrapping `useEcharts`. Accepts all hook options as props plus:

| Prop        | Type                    | Default                             | Description                                               |
| ----------- | ----------------------- | ----------------------------------- | --------------------------------------------------------- |
| `style`     | `React.CSSProperties`   | `{ width: '100%', height: '100%' }` | Container style (merged with defaults)                    |
| `className` | `string`                | —                                   | Container CSS class                                       |
| `ref`       | `Ref<UseEchartsReturn>` | —                                   | Exposes the full imperative API (see [Returns](#returns)) |

### `useEcharts(ref, options)`

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

**Lifecycle / updates**

| Method           | Type                                                                                 | Description                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setOption`      | `(option: EChartsOption, opts?: SetOptionOpts) => void`                              | Update chart configuration                                                                                                                            |
| `dispatchAction` | `(payload: Payload, opt?: boolean \| { silent?: boolean; flush?: boolean }) => void` | Dispatch an ECharts action (`highlight`, `downplay`, `showTip`, etc.)                                                                                 |
| `clear`          | `() => void`                                                                         | Clear current chart content                                                                                                                           |
| `resize`         | `(opts?: ResizeOpts) => void`                                                        | Manually trigger chart resize. `ResizeOpts` accepts `width`/`height`/`animation`/`silent`                                                             |
| `appendData`     | `(params: { seriesIndex: number; data: ArrayLike<unknown> }) => void`                | Append data to a series (streaming). Drift-aware: drops dedup memory so a subsequent shallow-equal-but-new-ref `option` rerender re-applies setOption |

**Read / introspect**

| Method        | Type                               | Description                                                                              |
| ------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `getInstance` | `() => ECharts \| undefined`       | Get ECharts instance                                                                     |
| `getOption`   | `() => EChartsOption \| undefined` | Get the current merged option                                                            |
| `getWidth`    | `() => number \| undefined`        | Container width in pixels                                                                |
| `getHeight`   | `() => number \| undefined`        | Container height in pixels                                                               |
| `getDom`      | `() => HTMLElement \| undefined`   | Underlying DOM container                                                                 |
| `isDisposed`  | `() => boolean`                    | Whether the instance is disposed (returns `true` when uninitialized — semantically gone) |

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
import { useLazyInit } from "react-use-echarts"; // standalone lazy init hook
import { isBuiltinTheme, registerCustomTheme } from "react-use-echarts"; // theme utils (no JSON)
import { registerBuiltinThemes } from "react-use-echarts/themes/registry"; // ~20KB theme JSON
import { useEcharts, EChart } from "react-use-echarts/core"; // tree-shakable entry (see Recipes)

// All exported types: UseEchartsOptions, UseEchartsReturn, EChartProps,
// EChartsEvents, EChartsEventConfig, EChartsEventHandler, EChartsInitOpts,
// BuiltinTheme, LoadingOption, ChartFinder, ChartScaleValue, Payload
// EChartsOption, SetOptionOpts, ResizeOpts come from the "echarts" package directly.
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
| `onChartReady`            | Use the imperative API                    | Read `getInstance()` from the hook return (or `ref.current`) — fires after first init                                                                                                  |
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
// chartRef.current?.getInstance() replaces onChartReady
```

## Contributing

We welcome all contributions. Please read the [contributing guidelines](CONTRIBUTING.md) first.

## Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/chensid/react-use-echarts/releases).

## License

[MIT](./LICENSE.txt) © [Ethan](https://github.com/chensid)
