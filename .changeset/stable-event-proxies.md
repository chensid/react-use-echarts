---
"react-use-echarts": minor
---

`onEvents` handlers no longer need to be memoized. Each event name is now bound once to a proxy that calls the handler from the latest render, so inline objects and inline lambdas no longer trigger an `off()`/`on()` rebind on every render, and handlers never see stale props between a render and the rebind. A rebind now happens only when an event name is added or removed, a `query` changes (compared shallowly, so inline `{ seriesIndex: 0 }` objects no longer rebind), or a `context` reference changes. Because ECharts now receives the proxy rather than your function, calling `instance.off(name, yourHandler)` directly no longer removes a listener bound through `onEvents`; remove the entry from `onEvents` instead.
