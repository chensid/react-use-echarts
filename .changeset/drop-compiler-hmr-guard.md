---
"react-use-echarts": patch
---

Stop shipping React Compiler's hot-reload cache reset in the published builds. Each compiled function (`useLazyInit` and `EChart`) started with a source-hash check that clears its memo cache when a dev server hot-swaps the file being edited. That never happens to a published file, so the check was dead weight. Both builds are about 0.2 kB smaller gzipped. No runtime behavior change.
