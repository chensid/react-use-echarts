---
"react-use-echarts": minor
---

Migrate internal effect-context error routing to React 19.2's stable `useEffectEvent`. The 10-field `LatestConfig` ref-sync bridge in `useChartCore` is replaced by direct closure capture for snapshot-at-init fields and `useEffectEvent` for cross-effect `onError` routing; only `setOptionOpts` and `onError` remain in a 2-field `ImperativeLatest` ref (used by the imperative API, which cannot call `useEffectEvent`). `useResizeObserver`'s `onErrorRef` is replaced by the same pattern.

Bumps `react` peer dependency to `^19.2.0` (required for stable `useEffectEvent`).

No public API change.
