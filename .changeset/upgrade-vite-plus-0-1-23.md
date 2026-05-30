---
"react-use-echarts": patch
---

Maintenance release. Upgrade the Vite+ build toolchain 0.1.22 → 0.1.23 (Vite 8.0.14, Rolldown 1.0.3, Vitest 4.1.7, Oxlint 1.67, Oxfmt 0.52) and refresh dev dependencies (`@arethetypeswrong/cli`, `@babel/core`, `react-router-dom`). Internal-only changes: removed redundant type assertions in the imperative API (public types and runtime behavior unchanged), and added `promise`/`import` lint guards plus a coverage threshold gate. No changes to the published API or runtime output.
