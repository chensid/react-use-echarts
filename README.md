# react-use-echarts

> [中文](./README.zh-CN.md) | [English](./README.md)

[![NPM version](https://img.shields.io/npm/v/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![NPM downloads](https://img.shields.io/npm/dm/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![CI](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml/badge.svg)](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/chensid/react-use-echarts/graph/badge.svg)](https://codecov.io/gh/chensid/react-use-echarts)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/chensid/react-use-echarts/npm-publish.yml)](https://github.com/chensid/react-use-echarts/actions/workflows/npm-publish.yml)
[![GitHub issues](https://img.shields.io/github/issues/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/pulls)
[![GitHub license](https://img.shields.io/github/license/chensid/react-use-echarts.svg)](https://github.com/chensid/react-use-echarts/blob/main/LICENSE.txt)

A React hooks library for Apache ECharts with full TypeScript support. Simple, lightweight, and gets out of your way.

## Features

- **Hook + Component** — use `useEcharts` hook or the declarative `<EChart />` component
- **TypeScript first** — written in TypeScript with complete type definitions
- **Zero dependencies** — no runtime deps beyond peer deps: `react`, `react-dom`, and `echarts`
- **Auto-resize** — handles container resizing via ResizeObserver
- **Themes** — built-in light, dark, and macarons themes, plus custom theme support
- **Chart linkage** — connect multiple charts for synchronized interactions
- **Lazy initialization** — defer chart init until element enters viewport
- **Event handling** — flexible event system with shorthand and full config modes
- **Loading state** — built-in loading indicator management
- **Error handling** — optional `onError` callback with deterministic fallback behavior
- **StrictMode safe** — instance cache with reference counting handles double mount/unmount

## Requirements

- React 19.2+ (`react` + `react-dom`)
- ECharts 6.x

> **Note**: This library is designed for client-side rendering (CSR) only. Server-side rendering (SSR) is not supported as ECharts requires DOM access.

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

### `useEcharts` Hook

For full control, use the hook directly:

```tsx
import { useRef } from "react";
import { useEcharts } from "react-use-echarts";

function MyChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  const { setOption, getInstance, resize } = useEcharts(chartRef, {
    option: {
      xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
      yAxis: { type: "value" },
      series: [{ data: [150, 230, 224, 218, 135], type: "line" }],
    },
  });

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
}
```

## Recipes

### Event Handling

Supports shorthand (function) and full config (object with query/context):

```tsx
useEcharts(chartRef, {
  option,
  onEvents: {
    // Shorthand — just pass a function
    click: (params) => console.log("Clicked:", params),
    // Full config — when you need query or context
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
  loadingOption: { text: "Loading..." }, // optional
});
```

### Themes

Built-in: `light`, `dark`, `macarons`. Or pass a custom theme object:

```tsx
// Built-in theme
useEcharts(chartRef, { option, theme: "dark" });

// Custom theme object (use useMemo to keep reference stable)
const customTheme = useMemo(
  () => ({
    color: ["#fc8452", "#9a60b4", "#ea7ccc"],
    backgroundColor: "#1e1e1e",
  }),
  [],
);

useEcharts(chartRef, { option, theme: customTheme });
```

### Chart Linkage

Connect charts by assigning the same `group` ID — tooltips, highlights, and other interactions will sync:

```tsx
useEcharts(chartRef1, { option: option1, group: "dashboard" });
useEcharts(chartRef2, { option: option2, group: "dashboard" });
```

### Lazy Initialization

Defer chart init until the element scrolls into view. Ideal for pages with many charts:

```tsx
// Use defaults (rootMargin: '50px', threshold: 0.1)
useEcharts(chartRef, { option, lazyInit: true });

// Custom IntersectionObserver options
useEcharts(chartRef, { option, lazyInit: { rootMargin: "200px", threshold: 0.5 } });
```

### SVG Renderer

```tsx
useEcharts(chartRef, { option, renderer: "svg" });
```

### Accessing ECharts Instance

Use `getInstance()` for advanced operations like exporting images:

```tsx
const { getInstance } = useEcharts(chartRef, { option });

const exportImage = () => {
  const instance = getInstance();
  if (instance) {
    const url = instance.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#fff" });
    const link = document.createElement("a");
    link.download = "chart.png";
    link.href = url;
    link.click();
  }
};
```

### Error Handling

```tsx
useEcharts(chartRef, {
  option,
  onError: (error) => console.error("Chart error:", error),
});
```

Without `onError`: init / first `setOption` failures are reported with `console.error`; option-update or imperative `setOption` failures are rethrown.

### Using the Component Ref

Access hook return values through the component ref:

```tsx
import { useRef } from "react";
import { EChart } from "react-use-echarts";
import type { UseEchartsReturn } from "react-use-echarts";

function MyChart() {
  const chartRef = useRef<UseEchartsReturn>(null);

  return (
    <div>
      <button onClick={() => chartRef.current?.resize()}>Resize</button>
      <EChart ref={chartRef} option={option} style={{ height: "600px" }} className="my-chart" />
    </div>
  );
}
```

## API Reference

### `<EChart />` Props

Declarative component wrapping `useEcharts`. Accepts all hook options as props plus:

| Prop        | Type                    | Default                              | Description                                  |
| ----------- | ----------------------- | ------------------------------------ | -------------------------------------------- |
| `style`     | `React.CSSProperties`   | `{ width: '100%', height: '400px' }` | Container style (merged with defaults)       |
| `className` | `string`                | —                                    | Container CSS class                          |
| `ref`       | `Ref<UseEchartsReturn>` | —                                    | Exposes `{ setOption, getInstance, resize }` |

### `useEcharts(ref, options)`

#### Options

| Option          | Type                                                | Default    | Description                                                        |
| --------------- | --------------------------------------------------- | ---------- | ------------------------------------------------------------------ |
| `option`        | `EChartsOption`                                     | (required) | ECharts configuration                                              |
| `theme`         | `'light' \| 'dark' \| 'macarons' \| object \| null` | `null`     | Theme name or custom theme object                                  |
| `renderer`      | `'canvas' \| 'svg'`                                 | `'canvas'` | Renderer type                                                      |
| `lazyInit`      | `boolean \| IntersectionObserverInit`               | `false`    | Lazy initialization via IntersectionObserver                       |
| `group`         | `string`                                            | —          | Chart linkage group ID                                             |
| `setOptionOpts` | `SetOptionOpts`                                     | —          | Default options for `setOption` calls                              |
| `showLoading`   | `boolean`                                           | `false`    | Show loading indicator                                             |
| `loadingOption` | `object`                                            | —          | Loading indicator configuration                                    |
| `onEvents`      | `EChartsEvents`                                     | —          | Event handlers (`fn` or `{ handler, query?, context? }`)           |
| `autoResize`    | `boolean`                                           | `true`     | Auto-resize via ResizeObserver                                     |
| `initOpts`      | `EChartsInitOpts`                                   | —          | Passed to `echarts.init()` (devicePixelRatio, locale, width, etc.) |
| `onError`       | `(error: unknown) => void`                          | —          | Error handler for init/setOption operations                        |

#### Returns

| Method        | Type                                                    | Description                   |
| ------------- | ------------------------------------------------------- | ----------------------------- |
| `setOption`   | `(option: EChartsOption, opts?: SetOptionOpts) => void` | Update chart configuration    |
| `getInstance` | `() => ECharts \| undefined`                            | Get ECharts instance          |
| `resize`      | `() => void`                                            | Manually trigger chart resize |

### `useLazyInit(ref, options)`

Standalone lazy initialization hook based on IntersectionObserver.

```tsx
import { useLazyInit } from "react-use-echarts";

const isInView = useLazyInit(elementRef, true); // or pass IntersectionObserverInit
```

Returns `boolean` — `true` once the element enters the viewport (or immediately if `options` is `false`).

### Theme Utilities

```tsx
import {
  getAvailableThemes, // () => ['light', 'dark', 'macarons']
  isBuiltinTheme, // (name: string) => boolean
  getBuiltinTheme, // (name: BuiltinTheme) => object | null
  registerCustomTheme, // (name: string, config: object) => void
  registerBuiltinThemes, // () => void — manual registration (usually unnecessary)
  ensureBuiltinThemesRegistered, // () => void — idempotent, called automatically
} from "react-use-echarts";
```

### Advanced Utilities

Instance cache and group linkage utilities for advanced use cases:

```tsx
import {
  // Instance cache — WeakMap-based with reference counting
  getCachedInstance, // (element) => ECharts | undefined
  setCachedInstance, // (element, instance) => ECharts
  replaceCachedInstance, // (element, instance) => ECharts
  releaseCachedInstance, // (element) => void
  getReferenceCount, // (element) => number
  clearInstanceCache, // () => void

  // Group linkage — manual chart group management
  addToGroup, // (instance, groupId) => void
  removeFromGroup, // (instance, groupId) => void
  updateGroup, // (instance, oldGroupId?, newGroupId?) => void
  getGroupInstances, // (groupId) => ECharts[]
  getInstanceGroup, // (instance) => string | undefined
  isInGroup, // (instance) => boolean
  clearGroups, // () => void
} from "react-use-echarts";
```

### Exported Types

```tsx
import type {
  UseEchartsOptions,
  UseEchartsReturn,
  EChartProps,
  EChartsEvents,
  EChartsEventConfig,
  EChartsInitOpts,
  BuiltinTheme,
} from "react-use-echarts";
```

## Development (Vite+)

This repository is aligned with the Vite+ toolchain:

- `vp install` — install dependencies (delegates to `packageManager`, currently pnpm)
- `vp dev` — run the examples dev server (`http://localhost:3000`)
- `vp check` — run format + lint + typecheck
- `vp test run --coverage` — run tests with coverage
- `vp pack` — build library artifacts into `dist/`

`package.json` also maps core tools to Vite+ packages:

- `vite` → `@voidzero-dev/vite-plus-core`
- `vitest` → `@voidzero-dev/vite-plus-test`

CI and release workflows use `voidzero-dev/setup-vp` plus `vp` commands for install/check/build.

## Contributing

We welcome all contributions. Please read our [contributing guidelines](CONTRIBUTING.md) first. You can submit ideas as [pull requests](https://github.com/chensid/react-use-echarts/pulls) or [GitHub issues](https://github.com/chensid/react-use-echarts/issues).

## Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/chensid/react-use-echarts/releases).

## License

[MIT](./LICENSE.txt) © [Ethan](https://github.com/chensid)
