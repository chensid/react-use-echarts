---
"react-use-echarts": patch
---

Pass custom `theme` objects straight to `echarts.init`, as the ECharts API documents, instead of registering each distinct object globally under a generated `__custom_theme_N` name. ECharts never unregisters themes, so apps that build theme objects dynamically no longer grow ECharts' process-wide theme registry. Rendering is unchanged, and a content-equal inline theme object still does not recreate the chart.
