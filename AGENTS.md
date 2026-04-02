# react-use-echarts

React hooks & component for Apache ECharts. CSR only — ECharts requires DOM access, no SSR/SSG.

Peer deps: `react` 19.2+, `react-dom` 19.2+, `echarts` 6.x

## API Quick Reference

### `useEcharts(ref, options)` → `{ setOption, getInstance, resize }`

Options: `option` (required), `theme`, `renderer` (`'canvas'`|`'svg'`), `lazyInit`, `group`, `setOptionOpts`, `showLoading`, `loadingOption`, `onEvents`, `autoResize` (default `true`), `initOpts`, `onError`

- `setOption(option, opts?)` — update chart config
- `getInstance()` — get ECharts instance or `undefined`
- `resize()` — manual resize trigger

### `<EChart />` Component

All `useEcharts` options as props + `style` (default `{ width: '100%', height: '400px' }`), `className`, `ref` (exposes `{ setOption, getInstance, resize }`)

### Other Exports

- `registerBuiltinThemes()` — register built-in themes (call once at startup)
- `getBuiltinTheme(name)`, `getAvailableThemes()`, `isBuiltinTheme(name)`, `registerCustomTheme(name, config)`
- `useLazyInit(ref, options)` — standalone lazy init hook

## Gotchas

- **Container needs explicit width/height** — chart won't render in a zero-size div
- **`option` is reactive** — changes auto-trigger `setOption`, no manual call needed
- **Custom theme objects must be memoized** — use `useMemo` to avoid instance recreation
- **`initOpts` changes recreate the instance** — don't pass inline objects
- **Built-in themes need registration** — call `registerBuiltinThemes()` before using `"light"`, `"dark"`, `"macarons"`
- **`onEvents` supports two forms** — shorthand `(params) => void` or full `{ handler, query?, context? }`
- **Chart linkage** — same `group` string syncs tooltips/highlights across charts

For usage examples and full API details, see `README.md` in this package.
