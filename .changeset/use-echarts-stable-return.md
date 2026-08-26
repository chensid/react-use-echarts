---
"react-use-echarts": patch
---

Return a referentially stable object from `useEcharts`. `useChartCore` already memoizes the imperative API it hands back, but `useEcharts` re-spread it into a fresh `{ ref, ...chart }` literal on every render, so callers received a new identity each time even when nothing changed. The merge is now wrapped in `useMemo`, matching how `useChartCore` caches its own return.

The hook result can now be used directly in a dependency array. In practice this also stops `<EChart>` from re-creating and re-assigning its imperative handle on every render, since that handle's `useImperativeHandle` deps are keyed on the hook result.
