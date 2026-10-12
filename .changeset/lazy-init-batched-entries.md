---
"react-use-echarts": patch
---

`lazyInit` / `useLazyInit` now latch when any record in an IntersectionObserver batch intersects. Previously only the first record was read, so a batch holding a stale non-intersecting record ahead of the current intersecting one was ignored, and a container that then stayed in view never initialized the chart.
