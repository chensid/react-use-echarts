---
"react-use-echarts": patch
---

`setOptionOpts` is now compared by value (keyed by its `JSON.stringify` output, like `theme` and `initOpts`). An inline `setOptionOpts={{ replaceMerge: ["series"] }}`, or any opts object with a nested `replaceMerge` array or `transition` object, no longer re-runs `setOption` on every render. As a result, what an imperative `setOption`, `clear` or `appendData` leaves on the chart now survives unrelated re-renders whether or not `setOptionOpts` is referentially stable, and lasts until the next real prop change: a new `option` reference or a changed `setOptionOpts` value. Before, an inline `setOptionOpts` made the next re-render re-apply the declarative option.
