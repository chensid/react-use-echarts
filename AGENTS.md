# react-use-echarts

React hooks & component for Apache ECharts. CSR only — ECharts requires DOM access, no SSR/SSG.

Peer deps: `react` 19+, `react-dom` 19+, `echarts` 6.x

Distribution: ESM-only (since 1.3.0). Requires Node.js 22+ on the tooling side.

## API Quick Reference

### `useEcharts(ref, options)` → `{ setOption, getInstance, resize }`

Options: `option` (required), `theme`, `renderer` (`'canvas'`|`'svg'`), `lazyInit`, `group`, `setOptionOpts`, `showLoading`, `loadingOption`, `onEvents`, `autoResize` (default `true`), `initOpts`, `onError`

- `setOption(option, opts?)` — update chart config
- `getInstance()` — get ECharts instance or `undefined`
- `resize()` — manual resize trigger

### `<EChart />` Component

All `useEcharts` options as props + `style` (default `{ width: '100%', height: '100%' }`), `className`, `ref` (exposes `{ setOption, getInstance, resize }`)

### Other Exports

- `isBuiltinTheme(name)`, `isKnownTheme(name)`, `registerCustomTheme(name, config)` — from `'react-use-echarts'`
- `registerBuiltinThemes()` — from `'react-use-echarts/themes/registry'` (separate entry, ~20KB theme JSON)
- `useLazyInit(ref, options)` — standalone lazy init hook
- `'react-use-echarts/core'` — tree-shakable subpath entry. Same public API as the default, but skips `import "echarts"` so consumers register only the chart types they use via `echarts.use([...])`. Pair with `import * as echarts from "echarts/core"`.

## Gotchas

- **Container needs explicit width/height** — chart won't render in a zero-size div
- **`option` is reactive** — changes auto-trigger `setOption`, no manual call needed
- **Custom theme objects must be memoized** — use `useMemo` to avoid instance recreation
- **`initOpts` changes recreate the instance** — don't pass inline objects
- **Built-in themes need registration** — `import { registerBuiltinThemes } from 'react-use-echarts/themes/registry'` and call once before using `"light"`, `"dark"`, `"macarons"`
- **`onEvents` supports two forms** — shorthand `(params) => void` or full `{ handler, query?, context? }`
- **Chart linkage** — same `group` string syncs tooltips/highlights across charts

For usage examples and full API details, see `README.md` in this package.
