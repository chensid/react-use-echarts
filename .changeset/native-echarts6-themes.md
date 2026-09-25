---
"react-use-echarts": minor
---

Use ECharts 6's own themes for the `"light"` and `"dark"` built-ins. `"dark"` is now the dark theme that `echarts/core` registers itself, and `"light"` resolves to ECharts' `"default"` theme; neither needs `registerBuiltinThemes()` any more, and the misleading dev warning claiming `"dark"` would fall back to the default theme is gone. `registerBuiltinThemes()` now registers only `"macarons"` and no longer overwrites ECharts' dark theme with the ECharts 5 palette, which also shrinks the `themes/registry` entry. Charts using `"light"` or `"dark"` therefore render with the ECharts 6 palette instead of the ECharts 5 one. To keep the old look, use the theme ECharts ships for that purpose, `echarts/theme/v5.js` (registered as `"v5"`), as described in the ECharts 6 upgrade notes.
