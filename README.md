# react-use-echarts

> [中文](./README-zh_CN.md) | [English](./README.md)

[![NPM version](https://img.shields.io/npm/v/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![NPM downloads](https://img.shields.io/npm/dm/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![CI](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml/badge.svg)](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/chensid/react-use-echarts/graph/badge.svg)](https://codecov.io/gh/chensid/react-use-echarts)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/chensid/react-use-echarts/npm-publish.yml)](https://github.com/chensid/react-use-echarts/actions/workflows/npm-publish.yml)
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

> **Note**: CSR only. ECharts requires DOM access, so SSR is not supported.

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

Pass `ref` to access `{ setOption, getInstance, resize }` imperatively.

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

## API Reference

### `<EChart />` Props

Declarative component wrapping `useEcharts`. Accepts all hook options as props plus:

| Prop        | Type                    | Default                                                 | Description                                  |
| ----------- | ----------------------- | ------------------------------------------------------- | -------------------------------------------- |
| `style`     | `React.CSSProperties`   | `{ width: '100%', height: '100%', minHeight: '400px' }` | Container style (merged with defaults)       |
| `className` | `string`                | —                                                       | Container CSS class                          |
| `ref`       | `Ref<UseEchartsReturn>` | —                                                       | Exposes `{ setOption, getInstance, resize }` |

### `useEcharts(ref, options)`

#### Options

| Option          | Type                                  | Default    | Description                                                                                                     |
| --------------- | ------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `option`        | `EChartsOption`                       | (required) | ECharts configuration                                                                                           |
| `theme`         | `string \| object \| null`            | `null`     | Any registered theme name, or custom theme object                                                               |
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

| Method        | Type                                                    | Description                   |
| ------------- | ------------------------------------------------------- | ----------------------------- |
| `setOption`   | `(option: EChartsOption, opts?: SetOptionOpts) => void` | Update chart configuration    |
| `getInstance` | `() => ECharts \| undefined`                            | Get ECharts instance          |
| `resize`      | `() => void`                                            | Manually trigger chart resize |

### Other Exports

```tsx
// Standalone lazy init hook
import { useLazyInit } from "react-use-echarts";
const isInView = useLazyInit(elementRef, true);

// Theme utilities (lightweight, from main entry)
import { isBuiltinTheme, registerCustomTheme } from "react-use-echarts";

// Theme registry (separate entry, includes ~20KB theme JSON)
import {
  registerBuiltinThemes, // () => void — register built-in themes
  getBuiltinTheme, // (name) => object | null
  getAvailableThemes, // () => ['light', 'dark', 'macarons']
} from "react-use-echarts/themes/registry";

// Types (from this library)
import type {
  UseEchartsOptions,
  UseEchartsReturn,
  EChartProps,
  EChartsEvents,
  EChartsEventConfig,
  EChartsInitOpts,
  BuiltinTheme,
  LoadingOption,
} from "react-use-echarts";

// Types used in API signatures (from echarts directly)
import type { EChartsOption, SetOptionOpts } from "echarts";
```

## Contributing

We welcome all contributions. Please read the [contributing guidelines](CONTRIBUTING.md) first.

## Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/chensid/react-use-echarts/releases).

## License

[MIT](./LICENSE.txt) © [Ethan](https://github.com/chensid)
