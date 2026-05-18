---
"react-use-echarts": patch
---

Fix `sideEffects: false` causing bundlers to tree-shake `import "echarts"` from the default entry, leaving the global ECharts registry empty and producing `TypeError: xa[a] is not a constructor` (or similar) at `echarts.init`.

Switch to a whitelist that preserves the side-effect import in `dist/index.js` (consumer-side) and `src/index.ts` (this repo's showcase). The `/core` and `/themes/registry` sub-entries remain fully tree-shakable since they're not in the whitelist.

Regression introduced when `import "echarts"` was added to the default entry alongside the `/core` sub-entry without updating the package-level `sideEffects` field.
