# react-use-echarts

React hooks & component for Apache ECharts. CSR only — ECharts requires DOM access, no SSR/SSG.

Peer deps: `react` 19.2+ (for stable `useEffectEvent`), `react-dom` 19.2+, `echarts` 6.x

Distribution: ESM-only (since 1.3.0). Requires Node.js 22.13+ on the tooling side.

## API Quick Reference

### `useEcharts(options)` → `{ ref, instance, setOption, resize, ... }`

Options: `option` (required), `theme`, `renderer` (`'canvas'`|`'svg'`), `lazyInit`, `group`, `setOptionOpts`, `showLoading`, `loadingOption`, `onEvents`, `autoResize` (default `true`), `initOpts`, `onError`

- `ref` — `RefCallback<HTMLDivElement>` to attach to the container
- `instance` — `ECharts | undefined` (reactive — defined after init, undefined before/after dispose)
- `setOption(option, opts?)` — update chart config
- `resize(opts?)` — manual resize trigger
- Imperative methods: `dispatchAction`, `clear`, `appendData`, `getOption`, `getDataURL`, `getConnectedDataURL`, `renderToSVGString`, `getSvgDataURL`, `getWidth`, `getHeight`, `getDom`, `isDisposed`, `convertToPixel`, `convertFromPixel`, `containPixel`

### `<EChart />` Component

All `useEcharts` options as props + native `div` attributes (`id`, `role`, `aria-*`, `data-*`, DOM events, etc.; excluding `children` and `dangerouslySetInnerHTML`) + `style` (default `{ width: '100%', height: '100%' }`), `className`, `ref` (typed `Ref<EChartHandle>` — same imperative surface as `UseEchartsReturn` minus the container `ref` field, which `<EChart>` owns)

### Other Exports

- `isBuiltinTheme(name)`, `isKnownTheme(name)`, `registerCustomTheme(name, config)` — from `'react-use-echarts'`
- `mergeRefs(...refs)` — compose multiple refs (RefObject or RefCallback) into one callback ref; isolates throws per-ref so a misbehaving 3rd-party ref can't strand the chart
- `registerBuiltinThemes()` — from `'react-use-echarts/themes/registry'` (separate entry, ~20KB theme JSON)
- `registerEchartsFull()` — from `'react-use-echarts/preset-full'`; one-line registrar that calls `echarts.use(...)` with every built-in chart, component, renderer and feature. Call once at app entry.
- `useLazyInit(options)` → `{ ref, isInView }` — standalone lazy-init hook

## Gotchas

- **Container needs explicit width/height** — chart won't render in a zero-size div
- **ECharts modules must be registered before first render** — the library is fully modular and does **not** auto-register anything. Call `registerEchartsFull()` (from `'react-use-echarts/preset-full'`) at app entry for an everything-included experience, or call `echarts.use([...])` selectively for tree-shake-friendly builds. Forgetting this shows up as `Renderer 'undefined' is not imported` or a silently blank chart.
- **Legacy `/core` imports are gone in v3** — use `from 'react-use-echarts'`; the old `react-use-echarts/core` alias was removed.
- **`option` is reference-reactive** — a new reference auto-triggers `setOption`; in-place mutation is not observed
- **Custom theme objects are content-keyed** — equivalent serializable objects do not recreate the instance; memoize to avoid repeated serialization, and never mutate in place
- **`initOpts` is content-keyed** — content changes recreate the instance; memoize for performance and never mutate in place
- **Built-in themes need registration** — `import { registerBuiltinThemes } from 'react-use-echarts/themes/registry'` and call once before using `"light"`, `"dark"`, `"macarons"`
- **`onEvents` supports two forms** — shorthand `(params) => void` or full `{ handler, query?, context? }`; equivalent wrapper objects dedup, but new inline handlers rebind
- **Chart linkage** — same `group` string syncs tooltips/highlights across charts

For usage examples and full API details, see `README.md` in this package.
