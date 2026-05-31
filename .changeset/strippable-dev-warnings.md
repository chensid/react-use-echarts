---
"react-use-echarts": patch
---

Dev-mode console warnings are now strippable from consumer production bundles. The published entries (`index`, `core`, `preset-full`) preserve `process.env.NODE_ENV` instead of baking the library's build-time value, so each consumer's bundler dead-code-eliminates the dev-only warnings in their production build (~0.6 KB gzip) while keeping them in development. Also trims a per-render allocation in the chart hook's imperative-API ref sync, collapses the deprecated `core` entry to a thin re-export of the default entry, and removes an unused internal `isInGroup` helper. No public API changes.
