---
"react-use-echarts": patch
---

Stop shipping JSDoc comments in the published JavaScript. API documentation still ships in the `.d.ts` files that editors read, so IntelliSense is unchanged, while `dist/index.js` drops from about 13.5 KB to about 7.1 KB gzipped. The `"use client"` directive and the `@__PURE__` annotations that bundlers use for tree-shaking are kept.
