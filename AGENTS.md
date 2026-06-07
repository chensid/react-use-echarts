# react-use-echarts

React hooks & component for Apache ECharts. CSR only — ECharts requires DOM access, no SSR/SSG.

Peer deps: `react` 19.2+ (for stable `useEffectEvent`), `react-dom` 19.2+, `echarts` 6.x

Distribution: ESM-only (since 1.3.0). Requires Node.js 22+ on the tooling side.

## API Quick Reference

### `useEcharts(options)` → `{ ref, instance, setOption, resize, ... }`

Options: `option` (required), `theme`, `renderer` (`'canvas'`|`'svg'`), `lazyInit`, `group`, `setOptionOpts`, `showLoading`, `loadingOption`, `onEvents`, `autoResize` (default `true`), `initOpts`, `onError`

- `ref` — `RefCallback<HTMLDivElement>` to attach to the container
- `instance` — `ECharts | undefined` (reactive — defined after init, undefined before/after dispose)
- `setOption(option, opts?)` — update chart config
- `resize(opts?)` — manual resize trigger
- Imperative methods: `dispatchAction`, `clear`, `appendData`, `getOption`, `getDataURL`, `getConnectedDataURL`, `renderToSVGString`, `getSvgDataURL`, `getWidth`, `getHeight`, `getDom`, `isDisposed`, `convertToPixel`, `convertFromPixel`, `containPixel`

### `<EChart />` Component

All `useEcharts` options as props + `style` (default `{ width: '100%', height: '100%' }`), `className`, `ref` (typed `Ref<EChartHandle>` — same imperative surface as `UseEchartsReturn` minus the container `ref` field, which `<EChart>` owns)

### Other Exports

- `isBuiltinTheme(name)`, `isKnownTheme(name)`, `registerCustomTheme(name, config)` — from `'react-use-echarts'`
- `mergeRefs(...refs)` — compose multiple refs (RefObject or RefCallback) into one callback ref; isolates throws per-ref so a misbehaving 3rd-party ref can't strand the chart
- `registerBuiltinThemes()` — from `'react-use-echarts/themes/registry'` (separate entry, ~20KB theme JSON)
- `registerEchartsFull()` — from `'react-use-echarts/preset-full'`; one-line registrar that calls `echarts.use(...)` with every built-in chart, component, renderer and feature. Call once at app entry.
- `useLazyInit(options)` → `{ ref, isInView }` — standalone lazy-init hook
- `'react-use-echarts/core'` — **deprecated since v2.1**, plain alias of the default entry (both are now modular). Will be removed in v4.

## Gotchas

- **Container needs explicit width/height** — chart won't render in a zero-size div
- **ECharts modules must be registered before first render** — the library is fully modular and does **not** auto-register anything. Call `registerEchartsFull()` (from `'react-use-echarts/preset-full'`) at app entry for an everything-included experience, or call `echarts.use([...])` selectively for tree-shake-friendly builds. Forgetting this shows up as `Renderer 'undefined' is not imported` or a silently blank chart.
- **`option` is reactive** — changes auto-trigger `setOption`, no manual call needed
- **Custom theme objects must be memoized** — use `useMemo` to avoid instance recreation
- **`initOpts` changes recreate the instance** — don't pass inline objects
- **Built-in themes need registration** — `import { registerBuiltinThemes } from 'react-use-echarts/themes/registry'` and call once before using `"light"`, `"dark"`, `"macarons"`
- **`onEvents` supports two forms** — shorthand `(params) => void` or full `{ handler, query?, context? }`
- **Chart linkage** — same `group` string syncs tooltips/highlights across charts

For usage examples and full API details, see `README.md` in this package.
