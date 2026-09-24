# react-use-echarts — Development Guide

React hooks library for Apache ECharts. Hook + declarative component, TypeScript, zero runtime deps.

- **Peer deps:** React 19.2+ (`react` + `react-dom`; `useEffectEvent` requires 19.2), ECharts 6.x | **Tooling:** Node 22.19+ on 22.x, 24.11+ on 24.x, or 26+ | **CSR only** | **ESM-only** | **Package manager:** pnpm

## Vite+ Toolchain

> Full rules and common pitfalls: `node_modules/vite-plus/AGENTS.md`

Project-specific commands:

```bash
vp install                    # Install dependencies
vp dev                        # Dev server (localhost:3000, serves examples/)
vp build                      # Build examples app → site-dist/
vp pack                       # Library build → dist/
vp exec playwright install chromium # Install Chromium once (`--with-deps` on Linux/CI)
vp test                       # Single run of both configured projects
vp test --project unit        # Unit/happy-dom project only
vp test --project browser     # Real-Chromium browser project only
vp test watch                 # Watch mode
vp test --coverage --project unit # Coverage report (v8), matching CI
vp lint                       # Oxlint
vp check                      # format + lint + typecheck (typecheck via tsgolint)
```

**Pre-PR checklist:** install Chromium once, then run `vp check && vp test` (both projects).

### Vite+ toolchain

Vite+ manages Vite, Rolldown, Vitest, Oxfmt, Oxlint, oxlint-tsgolint, and tsdown as one toolchain. Read the current Vite+ pins from `pnpm-workspace.yaml` and run `vp toolchain` for bundled tool versions. Do not add the obsolete `@voidzero-dev/vite-plus-test` package. Consequences for dependency management:

- Dependency versions live in the root `pnpm-workspace.yaml` `catalog`. `package.json` uses `catalog:` for `vite`, `vite-plus`, `vitest`, `@vitest/browser-playwright`, and `@vitest/coverage-v8`.
- Keep `pnpm-workspace.yaml` overrides for both `vite` → `@voidzero-dev/vite-plus-core` and `vitest` → the exact bundled Vitest version. This keeps Vite+ internals, browser providers, coverage, and `vp test` on one runner copy. The override keys carry an explicit `@*` range (`vite@*` / `vitest@*`): a bare key matches every spec including `catalog:`, so `vp up` would rewrite the catalog reference to a concrete version. Do not drop the `@*`.
- Toolchain upgrades (Vite+ / pnpm pin): follow `CONTRIBUTING.md` → Toolchain Updates. Keep Vitest and its browser/coverage packages at the Vite+-bundled version, even when npm offers a newer major.
- pnpm enforces a built-in 24h `minimumReleaseAge` gate and, in loose mode, self-populates `minimumReleaseAgeExclude` in `pnpm-workspace.yaml` whenever an install pulls a version younger than 24h — so entries accumulate on their own. Each entry is a no-op once its version ages past 24h. `minimumReleaseAgeExcludePrune: true` (pnpm 11.22+) is enabled in `pnpm-workspace.yaml`, but do not rely on it: on 2026-09-14 (pnpm 12.4.1) `vp up` left ten entries in place ~6 days after they matured. Check real publish times (`npm view <pkg> time`) and prune matured entries by hand in every dependency-bump PR. Treat the list as generated installation policy, not permanent dependency configuration. Retain entries while their versions are still inside the release-age window; do not assume the list should be empty after an upgrade. Verify with `vp install --frozen-lockfile`, which is what CI runs: it re-validates the lockfile against the gate and fails with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` on any unexcluded immature version.
- Tests still import from `vite-plus/test`. Browser-mode providers are **opt-in peers**: `@vitest/browser-playwright` (its `playwright` peer is installed too), imported from `vite-plus/test/browser-playwright`. Keep provider and coverage package versions aligned to the catalog's bundled Vitest pin.
- The project uses stable TypeScript 7; read its pin from `package.json`. `vp exec tsc -b` checks the solution projects, while `vp check` uses tsgolint. Each `pack[]` entry explicitly pairs `tsconfig: "tsconfig.lib.json"` with `dts: { generator: "tsgo" }` so native declaration emission uses the library's leaf project. The bundled declaration plugin can infer `tsgo` for TS 7, but keep the explicit configuration for clarity. TypeScript 7's programmatic API is still experimental; the pack warning concerns that API, not the stability of the compiler release. Validate declaration changes with `vp pack` (including publint/ATTW), not type checking alone.

## Architecture

Hook decomposition (`useChartCore` / `useResizeObserver` effects) and the key design patterns live in `src/CLAUDE.md`, which loads when working under `src/`.

- React Compiler uses `@vitejs/plugin-react` + `@rolldown/plugin-babel` (`reactCompilerPreset()`) in the top-level `plugins` (dev/build) and two `pack[]` entries (index and preset-full). **Native compiler follow-up, measured on 2026-09-24 with Vite+ 1.0.0-rc.0 (tsdown 0.23.0), `@vitejs/plugin-react` 6.1.1 and `oxc-transform-react` 0.145.0 / 0.151.0:**
  - It works technically in both pipelines. Top-level `react({ compiler: true })` covers dev/build/tests. Each `pack[]` entry needs its own `react({ compiler: true, exclude: [/\/node_modules\//, /\.d\.[cm]?ts$/] })`: without the `.d.ts` exclude the plugin transforms rolldown-plugin-dts's virtual declaration modules and the build fails with `TS(1039)` (same as tsdown's "Native Oxc support (experimental)" recipe). Rolldown/tsdown have no built-in `reactCompiler` option; the plugin is the integration.
  - Measured result: 0.145.0 and 0.151.0 emit byte-identical `dist`; it caches `useLazyInit`, `EChart`, `useEcharts` and `useResizeObserver` (Babel: the first two), skips the same eslint-suppressed hooks, passes all tests, and leaves `.d.ts` unchanged. pnpm reports 0.151.0 as an unmet peer of `^0.145.0` but installs it.
  - Stay on Babel for upstream reasons, not technical ones. Revisit when all of these hold: the peer range is settled (vitejs/vite-plugin-react#1437); oxc-project/oxc#26519 (outlined-closure `ReferenceError`) and #26161 (BigInt literals) are fixed; recoverable diagnostics are exposed again (oxc-project/oxc#26318 — since 0.148 `logDiagnostics` cannot say why a function was skipped); and plugin-react/Oxc drop the experimental label. On adoption, re-verify memo caches, tests, and package output before removing the Babel dependencies.

## Testing

- Two Vitest projects (`test.projects` in `vite.config.ts`, whose comments describe each project's scope): **`unit`** — happy-dom + ECharts API fully mocked; **`browser`** — real chromium via `@vitest/browser-playwright` (`src/__tests__/browser/**`) for what happy-dom can't simulate. Smoke level: assert effects are observable, not exact frame counts.
- Coverage thresholds are enforced (v8: 95% statements/functions/lines, 90% branches); `vp test --coverage --project unit` exits non-zero when unmet, matching CI. Source sits at 100% today, so the gap is deliberate headroom for churn — not a licence to land uncovered code
- Shared mocks and unit-test gotchas live in `src/__tests__/CLAUDE.md`, which loads when working under `src/__tests__/`

## Conventions

- **Commit format:** `feat|fix|docs|test|refactor|chore: <subject>`
- **Types-first:** define types in `src/types/index.ts` before implementing
- **Resource cleanup:** effects that create subscriptions, listeners, observers, timers/RAFs, or other persistent resources must return paired cleanup; state/config synchronization effects need no cleanup when they acquire no resource
- **ECharts registration is the consumer's responsibility** — this library does NOT auto-register charts/components/renderers/features. Apps call `registerEchartsFull()` (from `react-use-echarts/preset-full`) for the everything-included path, or `echarts.use([...])` selectively. Mirrors `vue-echarts` / `nuxt-echarts` / `react-chartjs-2`. See `src/preset-full.ts` for the why.

## Anti-patterns

- **DO NOT** leave subscriptions, listeners, observers, timers/RAFs, or other persistent resources created by an effect without paired cleanup; synchronization-only effects are exempt
- **DO NOT** mutate `theme` or `initOpts` objects in place; distinct objects dedup only when their `JSON.stringify` output matches (property order affects the key), while memoization avoids repeated serialization
- **DO NOT** duplicate API reference from `README.md` into this file
- **DO NOT** re-add the removed `react-use-echarts/core` subpath — v3 consumers should import from `react-use-echarts`.
- **DO NOT** re-add `import "echarts"` to `src/index.ts` — the root entry must stay modular and must not force the full ECharts registry into every consumer bundle. Registration belongs in consumer-side code (their app entry or `registerEchartsFull()`).
- **DO NOT** import from `vitest` in tests or add `@voidzero-dev/vite-plus-test`. The `vitest` package is present only as an exact Vite+ catalog/override pin so Vite+ internals and opt-in providers share the bundled runner copy.

## Troubleshooting

| Problem                                                              | Cause                                                                     | Fix                                                                                                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Unit test fails: "echarts not mocked"                                | Missing `vi.mock("echarts/core")`                                         | Add mock before imports; browser tests use real registered ECharts modules                                                            |
| Test lint errors                                                     | `tsconfig.test.json` not correct                                          | Check `include` patterns                                                                                                              |
| `vp pack`: `tsgo did not generate dts file for …`                    | A `pack[]` entry lost its TS 7 dts settings                               | Every `pack[]` entry in `vite.config.ts` needs `tsconfig: "tsconfig.lib.json"` + `dts: { generator: "tsgo" }`                         |
| StrictMode double-mount issues                                       | Instance cache refCount mismatch                                          | Check `src/utils/instance-cache.ts` logic                                                                                             |
| `TypeError: ka[a] is not a constructor` at first `useEcharts()` init | App forgot to register charts/renderers                                   | Call `registerEchartsFull()` at app entry, or `echarts.use([...])` selectively before render                                          |
| `vp test`: `Could not find 'vitest' bin entry`                       | Stale `vitest`/`vite-plus-test` alias or mismatched catalog/override pins | Rerun `vp migrate --no-interactive`, keep tests on `vite-plus/test`, and verify `vp --version` bundled Vitest matches the catalog pin |
