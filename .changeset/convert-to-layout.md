---
"react-use-echarts": minor
---

Add `convertToLayout` (ECharts 6.0) to the imperative API and the `<EChart>` handle, returning the new exported `ChartLayout` type, and forward the optional coordinate-system `opt` argument (e.g. matrix `{ clamp, ignoreMergeCells }`) that ECharts 6 accepts on `convertToPixel` / `convertFromPixel`. `ChartFinder` now accepts every documented `<componentType>Index | Id | Name` key — such as `calendarIndex`, `polarIndex` and `singleAxisIndex` — which ECharts' own finder typing omits.
