---
"react-use-echarts": minor
---

DX: re-export option types, route chart-group errors through `onError`, and add a dev hint for missing ECharts registration.

- **Re-export option types** — `EChartsOption`, `SetOptionOpts`, and `ResizeOpts` are now re-exported from `react-use-echarts`, so you can import them alongside the library's own types instead of reaching into the `echarts` package directly. Pure type re-exports: zero runtime cost, no `echarts` side-effect import.
- **Group error routing** — chart-group linkage (`updateGroup` → `echarts.connect` / `disconnect`) now routes failures through the shared `onError` callback, consistent with every other instance call. Previously a `connect` / `disconnect` throw could escape the effect.
- **Missing-registration dev hint** — in development, when `echarts.init` fails with a `… is not a constructor` error (the most common modular-entry pitfall), the library logs a one-time hint pointing to `registerEchartsFull()`. Gated on `process.env.NODE_ENV`, so it is stripped from consumer production builds.
