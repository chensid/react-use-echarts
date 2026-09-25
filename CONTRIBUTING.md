# Contributing to react-use-echarts

Thanks for your interest in improving `react-use-echarts`!

## Prerequisites

- Node.js 22.19+ on 22.x, 24.11+ on 24.x, or 26+ (CI covers the 22.x minimum and latest 24.x)
- Vite+ CLI (`vp`) available in your shell
- Git

## Quick Start

1. Fork this repository and clone it locally.
2. Install dependencies: `vp install`.
3. Install the Playwright Chromium binary: `vp exec playwright install chromium` (use `--with-deps` on Linux).
4. Create a feature branch: `git checkout -b feat/my-feature`.
5. Start the playground for manual verification: `vp dev` (serves the examples on <http://localhost:3000>).
6. Implement and self-test your changes.

## Development Commands

- `vp dev` – run the Vite dev server with the examples under `examples/`.
- `vp lint` – run Oxlint to check for issues.
- `vp check` – run format + lint + typecheck (via tsgolint) in one command.
- `vp test` – execute both configured Vitest projects once (single run by default).
- `vp test --project unit` – execute only the unit/happy-dom project.
- `vp test --project browser` – execute only the real-Chromium browser project.
- `vp test watch` – run the suite in watch mode while developing.
- `vp test --coverage --project unit` – generate the v8 coverage reports, matching CI.
- `vp build` – build the examples application with Vite into `site-dist/`.
- `vp pack` – build the library (ESM) and type declarations into `dist/`. Runs `publint` + `attw` automatically.

After installing Chromium, run `vp check && vp test` before opening a pull request; this covers both the unit and browser projects. CI additionally packs the library, enforces coverage and bundle budgets, repeats the unit project across its Node matrix, and runs the browser project on Node 24.

## Editor and TypeScript 7

For VS Code, install the workspace recommendations: [TypeScript 7](https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.native-preview) for the native language service, and [Vite Plus Extension Pack](https://marketplace.visualstudio.com/items?itemName=VoidZero.vite-plus-extension-pack) for Oxc and Vitest integration. Open a `.ts` or `.tsx` file and run **TypeScript: Enable TypeScript 7**, then select the workspace TypeScript version. The workspace's `js/ts.tsdk.path` points to the installed compiler; that path alone does not enable the native language service. The older JavaScript and TypeScript Nightly extension is not the TypeScript 7 extension.

The project uses stable TypeScript 7 for command-line checking (`vp exec tsc -b`) and declaration generation (`vp pack`). TypeScript 7's programmatic API remains experimental; a warning about that API during packing does not mean the compiler itself is a prerelease. Keep `tsconfig: "tsconfig.lib.json"` paired with `dts: { generator: "tsgo" }` in each pack entry, and validate declaration changes with `vp pack` as well as type checking.

## Toolchain Updates

Vite+ owns the local Vite/Vitest/Oxlint/Oxfmt/Rolldown toolchain. To align this repo with a new Vite+ release, upgrade the global CLI first (`vp upgrade`), then run `vp migrate --no-interactive` from the repository root and review the diff. The migration updates the pnpm catalog, Vite/Vitest overrides, lockfile, and supported build configuration. Use `--full` only when also refreshing the Vite+ hook/editor/agent setup. Keep Vitest and its browser/coverage packages aligned with the version bundled by Vite+.

Vite+ also manages the pnpm version pinned in `package.json`. Use `vp env pin pnpm@<version> --target package-manager --force` to upgrade it, then run `vp install` and verify `vp install --frozen-lockfile` before committing the updated manifest and lockfile.

## React Compiler

The React Compiler runs through Babel (`@rolldown/plugin-babel` with `reactCompilerPreset()`) in the top-level `plugins` and in the index and preset-full `pack[]` entries. The native Oxc compiler is deliberately deferred. Measured on 2026-09-24 with Vite+ 1.0.0-rc.0 (tsdown 0.23.0), `@vitejs/plugin-react` 6.1.1 and `oxc-transform-react` 0.145.0 / 0.151.0:

- It works technically in both pipelines. Top-level `react({ compiler: true })` covers dev/build/tests. Each `pack[]` entry needs its own `react({ compiler: true, exclude: [/\/node_modules\//, /\.d\.[cm]?ts$/] })`: without the `.d.ts` exclude the plugin transforms rolldown-plugin-dts's virtual declaration modules and the build fails with `TS(1039)` (same as tsdown's "Native Oxc support (experimental)" recipe). Rolldown/tsdown have no built-in `reactCompiler` option; the plugin is the integration.
- Measured result: 0.145.0 and 0.151.0 emit byte-identical `dist`; it caches `useLazyInit`, `EChart`, `useEcharts` and `useResizeObserver` (Babel: the first two), skips the same eslint-suppressed hooks, passes all tests, and leaves `.d.ts` unchanged. pnpm reports 0.151.0 as an unmet peer of `^0.145.0` but installs it.
- Stay on Babel for upstream reasons, not technical ones. Revisit when all of these hold: the peer range is settled (vitejs/vite-plugin-react#1437); oxc-project/oxc#26519 (outlined-closure `ReferenceError`) and #26161 (BigInt literals) are fixed; recoverable diagnostics are exposed again (oxc-project/oxc#26318 — since 0.148 `logDiagnostics` cannot say why a function was skipped); and plugin-react/Oxc drop the experimental label. On adoption, re-verify memo caches, tests, and package output before removing the Babel dependencies.

## Pull Request Guidelines

- Keep each PR focused on a single feature or fix.
- Update documentation in **both** `README.md` **and** `README-zh_CN.md` (and `examples/`, API comments) when behavior or public APIs change.
- Add or update tests in `src/__tests__` for any logic changes.
- Ensure `vp check` and `vp test` pass locally.
- Describe the motivation, solution, and validation steps in the PR body.
- **Add a changeset** (`pnpm changeset`) for any user-visible change — pick `patch` for fixes, `minor` for additive features, `major` for breaking changes. Internal-only refactors that don't affect the published API may skip this with a note in the PR description.

## Releasing

Releases are driven by [changesets](https://github.com/changesets/changesets):

1. PRs include a `.changeset/*.md` file describing the change.
2. Pushes to `main` run `ci.yml`; successful push-triggered CI completions start `release.yml` so Changesets can keep an open "Version Packages" PR or publish a merged version bump via npm OIDC.
3. The release job checks out `main` as it exists when that job runs, so the processed SHA can be newer than the CI run that triggered the workflow.

The "Version Packages" PR needs one manual step before it can be merged. Changesets opens it from a workflow using `GITHUB_TOKEN`, and GitHub creates the `pull_request` workflow run for such a PR in the `action_required` state rather than running it. Its `test (22)` / `test (24)` checks therefore never report, and because both are required the merge is refused with `405 2 of 2 required status checks are expected`. Unblock it either way:

- approve the parked run from the PR's checks tab (any user with write access), or
- run the CI workflow against the `changeset-release/main` branch from the Actions tab — `workflow_dispatch` is exempt from the `GITHUB_TOKEN` restrictions and is kept on `ci.yml` for exactly this.

Do not push a throwaway commit to the release branch to start CI. The documented behavior is in [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request); the approval settings under Actions cover forks only, so there is no repository toggle that removes this step. Creating the PR with a personal access token or GitHub App token instead of `GITHUB_TOKEN` would avoid it, at the cost of managing that credential.

For hotfixes, follow the same flow — open a PR with a `.changeset/*.md` describing the fix, then merge it and the resulting Version Packages PR. Don't include `changeset version` output (CHANGELOG / version bumps) in feature PRs; that belongs only in the auto-generated Version Packages PR.

## Reporting Issues

When filing an issue, please include:

- Version information: `react-use-echarts`, React, ECharts, Node.js.
- Clear steps to reproduce (ideally a minimal sandbox or code sample).
- Expected behavior and actual behavior.
- Any relevant logs, stack traces, or screenshots.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
