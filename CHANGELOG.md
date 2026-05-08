# react-use-echarts

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
