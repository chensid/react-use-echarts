# react-use-echarts

React hooks & component for Apache ECharts. CSR only — ECharts requires DOM access, no SSR/SSG.

Peer deps: `react` 19.2+, `react-dom` 19.2+, `echarts` 6.x

Distribution: ESM-only (since 1.3.0). No Node.js requirement for consumers (browser-only ESM); the Node.js range in `devEngines.runtime` applies only to developing this repo.

## API Quick Reference

### `useEcharts(options)` → `{ ref, instance, setOption, resize, ... }`

Options: `option` (required), `theme`, `renderer` (`'canvas'`|`'svg'`, default `'canvas'`), `lazyInit` (default `false`), `group`, `setOptionOpts`, `showLoading` (default `false`), `loadingOption`, `onEvents`, `autoResize` (default `true`), `initOpts`, `onError`

- `ref` — `RefCallback<HTMLDivElement>` to attach to the container
- `instance` — `ECharts | undefined` (reactive — defined after init, undefined before/after dispose); for an `onChartReady`-style callback, use `useEffect(() => { if (instance) onReady(instance); }, [instance, onReady])` — an `<EChart>` object ref is imperative-only and does not notify
- `setOption(option, opts?)` — update chart config
- `resize(opts?)` — manual resize trigger
- Imperative methods: `dispatchAction`, `clear`, `appendData`, `getOption`, `getDataURL`, `getConnectedDataURL`, `renderToSVGString`, `getSvgDataURL`, `getWidth`, `getHeight`, `getDom`, `isDisposed`, `convertToPixel`, `convertToLayout`, `convertFromPixel`, `containPixel` (convert methods take an optional coordinate-system `opt`, e.g. matrix `clamp`)
- The returned object is referentially stable — its identity only changes when `instance` or the container element changes, so it can go straight into a dependency array

### `<EChart />` Component

All `useEcharts` options as props + native `div` attributes (`id`, `role`, `aria-*`, `data-*`, DOM events, etc.; excluding `children` and `dangerouslySetInnerHTML`) + `style` (default `{ width: '100%', height: '100%' }`), `className`, `ref` (typed `Ref<EChartHandle>` — same imperative surface as `UseEchartsReturn` minus the container `ref` field, which `<EChart>` owns)

### Other Exports

- `isBuiltinTheme(name)`, `isKnownTheme(name)`, `registerCustomTheme(name, config)` — from `'react-use-echarts'`
- `mergeRefs(...refs)` — compose multiple refs (RefObject, legacy callback ref, or React 19 callback ref returning a cleanup) into one callback ref; `null` / `undefined` entries are skipped, and throws are isolated per-ref so a misbehaving 3rd-party ref can't strand the chart
- `registerBuiltinThemes()` — from `'react-use-echarts/themes/registry'` (separate entry, ~7KB macarons theme JSON)
- `registerEchartsFull()` — from `'react-use-echarts/preset-full'`; one-line registrar that calls `echarts.use(...)` with every built-in chart, component, renderer and feature. Call once at app entry.
- `useLazyInit(options)` → `{ ref, isInView }` — standalone lazy-init hook; enabled mode defaults to `rootMargin: '50px'` and `threshold: 0.1`

## Gotchas

- **Container needs explicit width/height** — chart won't render in a zero-size div
- **ECharts modules must be registered before first render** — the library is fully modular and does **not** auto-register anything. Call `registerEchartsFull()` (from `'react-use-echarts/preset-full'`) at app entry for an everything-included experience, or call `echarts.use([...])` selectively for tree-shake-friendly builds. Forgetting this shows up as `Renderer 'undefined' is not imported` or a silently blank chart.
- **Dev-only warnings ship in a `development` export-condition build** — Vite, webpack, Rspack, Next.js and Vitest resolve it in dev; esbuild, Bun and default Parcel get the production build (no warnings) unless the `development` condition is added. Neither build needs a `process` global
- **Legacy `/core` imports are gone in v3** — use `from 'react-use-echarts'`; the old `react-use-echarts/core` alias was removed.
- **`option` is reference-reactive** — a new reference auto-triggers `setOption`; in-place mutation is not observed
- **`setOptionOpts` is `JSON.stringify`-keyed** — value-equal inline objects (including nested `replaceMerge` arrays) don't re-run `setOption`; property order affects the key
- **Imperative `setOption` / `clear` / `appendData` last until the next real prop change** — unrelated re-renders keep them; a new `option` reference or changed `setOptionOpts` value re-applies the declarative option
- **Custom theme objects are `JSON.stringify`-keyed** — distinct serializable objects dedup only when their serialized output matches; serialization is not canonical, so property order affects the key. Memoize to avoid repeated serialization, and never mutate in place
- **`initOpts` is `JSON.stringify`-keyed** — a changed serialized output recreates the instance; serialization is not canonical, so property order affects the key. Memoize for performance and never mutate in place
- **Only `"macarons"` needs registration** — `"light"` / `"dark"` are ECharts 6's own themes (`"light"` = ECharts `"default"`); call `registerBuiltinThemes()` from `'react-use-echarts/themes/registry'` once before using `"macarons"`
- **`onEvents` supports two forms** — shorthand `(params) => void` or full `{ handler, query?, context? }`; inline objects/handlers are fine — proxies call the latest handler; only event-name, `query` (shallow) or `context` changes rebind. ECharts holds the proxy, so `instance.off(name, handler)` cannot remove these listeners — drop the key from `onEvents` instead
- **Chart linkage** — same `group` string syncs tooltips/highlights across charts
- **Lazy init is a one-shot latch** — `lazyInit` / `useLazyInit` forward only `root`, `rootMargin` and `threshold` to the `IntersectionObserver` (`scrollMargin` is ignored); once visible, the chart stays initialized, and turning `lazyInit` on after an eager init keeps the chart. Invalid observer settings log via `console.error` (not `onError`) and fall back to eager init
- **`onError` routing** — receives handled effect-operation and imperative API failures; without it, effect failures log via `console.error` and imperative methods rethrow. `off()` errors during dynamic event rebinding surface directly

For usage examples and full API details, see `README.md` in this package.
