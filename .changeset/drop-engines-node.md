---
"react-use-echarts": patch
---

The published package no longer declares `engines.node`. That range only described this repository's build tooling, yet package managers applied it to consumers' installs: npm and pnpm printed unsupported-engine warnings, and Yarn 1 refused to install on Node.js versions outside it. The library is browser-only ESM, so the range now lives in `devEngines.runtime`, which consumers' installs ignore.
