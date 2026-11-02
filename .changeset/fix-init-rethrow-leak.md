---
"react-use-echarts": patch
---

Fix instance leaks and cross-hook side effects in error and shared-element edge cases:

- An `onError` that rethrows during chart initialization (from the initial `setOption`, `showLoading`, event binding or group assignment) no longer leaks the ECharts instance: the hook releases it before the error reaches an error boundary.
- A hook that hasn't initialized yet (for example `lazyInit` before the chart scrolls into view) no longer applies its option, loading state, events or group to another hook's chart on the same element, and its imperative methods return their no-instance fallbacks until it initializes. Those methods now keep one identity for the hook's lifetime, including across a container element swap.
- After an imperative `setOption` call with no `setOptionOpts` prop, moving the `option` prop to that same object no longer re-applies it.
- The instance is still disposed when leaving its chart group throws; in development, an init error that can't be converted to a string still reaches `onError`; `mergeRefs` isolates a ref object whose assignment throws; a throwing `ResizeObserver.disconnect()` no longer leaves the shared `visibilitychange` listener attached.
- When a tab returns to the foreground, a chart with a resize still pending from the background now resizes once instead of twice.
