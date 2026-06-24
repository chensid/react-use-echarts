---
"react-use-echarts": major
---

Remove the deprecated `react-use-echarts/core` subpath. It has been a plain alias
of the default modular entry since v2.1; import from `react-use-echarts` instead.

Refresh the Quick Start so first-run examples register ECharts modules before
rendering and give the chart container an explicit size. Rename the selective
registration example away from the old `/core` terminology.
