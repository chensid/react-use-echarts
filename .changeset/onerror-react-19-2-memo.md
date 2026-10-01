---
"react-use-echarts": patch
---

Fix `onError` going stale on React 19.2 when the chart lives inside a `memo()` or `forwardRef` component — for example `memo(EChart)`, or a memoized component that calls `useEcharts`. Errors raised inside effects (init, option sync, loading, events, group, auto-resize, cleanup) kept going to the `onError` from the first render, because React 19.2.x never refreshes `useEffectEvent` callbacks in those components (fixed upstream in React 19.3). The library now reads the latest `onError` from a ref instead, so the peer range stays `react ^19.2.0`.
