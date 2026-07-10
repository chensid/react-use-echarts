---
"react-use-echarts": minor
---

Apply every new `option` reference so nested ECharts data mutations exposed through a
new top-level object are not skipped by shallow comparison.

Forward native `div` attributes from `<EChart />` to its container, including ARIA,
data attributes, focus properties, and DOM event handlers.
