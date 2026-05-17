# react-use-echarts

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
