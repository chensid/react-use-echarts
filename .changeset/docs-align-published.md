---
"react-use-echarts": patch
---

Correct the shipped documentation. The README and the shipped `AGENTS.md` drop the v1 migration row claiming an `engines.node >=20` floor that no release declared (and 3.3.0 removed `engines` altogether), state that `require(ESM)` needs Node.js 22.12+, and note that invalid `lazyInit` observer settings log via `console.error` rather than `onError`. `AGENTS.md` now says neither build needs a `process` global (the development build only reads it behind a `typeof` guard) and adds the lazy-init latch semantics, the `onError` routing rules and the `onChartReady`-style pattern that 3.1.8 described. The `EChartProps` JSDoc in the type declarations now names `dangerouslySetInnerHTML` alongside `children` as excluded. Documentation only — no runtime behavior change.
