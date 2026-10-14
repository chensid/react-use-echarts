---
"react-use-echarts": patch
---

Correct the shipped documentation. The README (English and Chinese) drops the v1 migration row claiming an `engines.node >=20` floor that no release declared (3.3.0 removed `engines` altogether) and states that `require(ESM)` needs Node.js 22.12+. The README and the shipped `AGENTS.md` both note that invalid `lazyInit` observer settings log via `console.error` rather than `onError`. `AGENTS.md` also says neither build needs a `process` global (the development build only reads it behind a `typeof` guard) and adds the lazy-init latch semantics, the `onError` routing rules and the `onChartReady`-style pattern that 3.1.8 described. The `EChartProps` JSDoc in the type declarations now names `dangerouslySetInnerHTML` alongside `children` as excluded. Documentation only — no runtime behavior change.
