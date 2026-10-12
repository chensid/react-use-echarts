---
"react-use-echarts": minor
---

The main entry now ships two builds, and neither needs a `process` global, so loading the package as raw ESM no longer throws `ReferenceError: process is not defined`. `dist/index.js` (the `default` export condition) is a production build with the dev-only warnings removed (about 1 KB smaller gzipped). `dist/development/index.js` (the new `development` condition) keeps the warnings, and consumers' Node-based test runs (`NODE_ENV=test`) still silence them. Vite, webpack, Rspack, Next.js (webpack and Turbopack) and Vitest select the development build automatically in dev. Setups that do not set the `development` condition by default (esbuild, Bun, Parcel's default resolver) now resolve the production build and no longer show dev-only warnings; add the `development` condition to keep them.
