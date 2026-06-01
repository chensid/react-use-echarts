---
"react-use-echarts": patch
---

robustness + perf + type hardening:

- visibility-coordinator: isolate each `visibilitychange` subscriber in its own
  try/catch. The coordinator runs a single shared document listener for every
  chart, so a callback that throws (e.g. a consumer `onError` that rethrows from
  the resize path) previously aborted the loop and starved every later chart's
  foreground resize resync. Mirrors merge-refs' per-callback isolation.
- event-utils: `eventsEqual` now uses a two-pass key walk (mirroring
  `shallowEqual`) instead of allocating a key-union `Set` per call. This path
  runs on every render when `onEvents` is an inline object literal, so the change
  removes a per-render allocation for charts with inline event handlers.
  Behavior is identical (verified by the existing eventsEqual suite).
- types: `EChartsEventConfig`'s object form marks `handler` / `query` / `context`
  `readonly`, matching the library's `ReadonlyArray` / `ReadonlySet` house style.
  Compile-time only — no runtime or usage change.

vp check + test green (100% coverage, 282 pass), attw/publint pass, size-limit under budget.
