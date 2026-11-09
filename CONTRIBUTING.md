# Contributing to react-use-echarts

Thanks for your interest in improving `react-use-echarts`!

## Prerequisites

- Node.js 24.11+ on 24.x, or 26+ (CI covers the 24.x minimum and latest 26.x). The range lives in `package.json` → `devEngines.runtime`, which Vite+ uses to select Node.js and pnpm checks on install. It is deliberately not `engines`, which package managers would apply to consumers' installs of this browser-only package.
- Vite+ CLI (`vp`) available in your shell
- Git 2.32+ (required by `vp staged`)

## Quick Start

1. Fork this repository and clone it locally.
2. Install dependencies: `vp install`.
3. Install the Playwright Chromium binary: `vp exec playwright install chromium` (use `--with-deps` on Linux).
4. Create a feature branch: `git checkout -b feat/my-feature`.
5. Start the playground for manual verification: `vp dev` (serves the examples on <http://localhost:3000>).
6. Implement and self-test your changes.

## Development Commands

- `vp dev` – run the Vite dev server with the examples under `examples/`.
- `vp check` – run format + lint + typecheck (via tsgolint) in one command; `vp lint` runs Oxlint alone.
- `vp test` – run all three Vitest projects once. Add `--project unit` (happy-dom), `--project browser` (real Chromium) or `--project examples` (smoke-tests every route of the examples app, served by `vp dev` on port 3190) to run just one.
- `vp test watch` – run the suite in watch mode.
- `vp test --coverage --project unit` – generate the v8 coverage reports, matching CI.
- `vp build` – build the examples application into `site-dist/`.
- `vp pack` – build the library (ESM) and type declarations into `dist/`. Runs `publint` + `attw` automatically.

After installing Chromium, run `vp check --deny-warnings && vp test` before opening a pull request; this covers the unit, browser and examples projects. `--deny-warnings` matches CI, which fails on lint warnings as well as errors. CI additionally packs the library, enforces coverage and bundle budgets, repeats the unit project across its Node matrix, and runs the browser and examples projects on Node 26.

## Editor and TypeScript 7

For VS Code, install the workspace recommendations: [TypeScript 7](https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.native-preview) for the native language service (not the older JavaScript and TypeScript Nightly extension), and [Vite Plus Extension Pack](https://marketplace.visualstudio.com/items?itemName=VoidZero.vite-plus-extension-pack) for Oxc and Vitest integration. Open a `.ts` or `.tsx` file and run **TypeScript: Enable TypeScript 7**, then select the workspace TypeScript version; the workspace's `js/ts.tsdk.path` alone does not enable the native language service.

The project uses stable TypeScript 7 for command-line checking (`vp exec tsc -b`) and declaration generation (`vp pack`). A warning during packing about TypeScript 7's experimental programmatic API does not mean the compiler is a prerelease. Keep `tsconfig: "tsconfig.lib.json"` paired with `dts: { generator: "tsgo" }` in each declaration-emitting pack entry, and validate declaration changes with `vp pack` as well as type checking.

## Toolchain Updates

Vite+ owns the local Vite/Vitest/Oxlint/Oxfmt/Rolldown toolchain. To align this repo with a new Vite+ release, upgrade the global CLI first (`vp upgrade`), then run `vp migrate --no-interactive` from the repository root and review the diff. The migration updates the pnpm catalog, Vite/Vitest overrides, lockfile, and supported build configuration. Use `--full` only when also refreshing the Vite+ hook/editor/agent setup. Keep Vitest and its browser/coverage packages aligned with the version bundled by Vite+.

Vite+ also manages the pnpm version pinned in `package.json`. Use `vp env pin pnpm@<version> --target package-manager --force` to upgrade it, then run `vp install` and verify `vp install --frozen-lockfile` before committing the updated manifest and lockfile.

## React Compiler

The React Compiler runs through Babel (`@rolldown/plugin-babel` with `reactCompilerPreset()`) in the top-level `plugins` and in the index and development/index `pack[]` entries. The native Oxc compiler works here but is deliberately deferred, for upstream reasons rather than technical ones. Last measured on 2026-09-24 with Vite+ 1.0.0-rc.0 (tsdown 0.23.0), `@vitejs/plugin-react` 6.1.1 and `oxc-transform-react` 0.145.0 / 0.151.0:

- **Integration:** top-level `react({ compiler: true })` covers dev/build/tests. Each `pack[]` entry needs its own `react({ compiler: true, exclude: [/\/node_modules\//, /\.d\.[cm]?ts$/] })`: without the `.d.ts` exclude the plugin transforms rolldown-plugin-dts's virtual declaration modules and the build fails with `TS(1039)`. Rolldown/tsdown have no built-in `reactCompiler` option.
- **Result:** 0.145.0 and 0.151.0 emit byte-identical `dist`; it caches `useLazyInit`, `EChart`, `useEcharts` and `useResizeObserver` (Babel: the first two), skips the same eslint-suppressed hooks, passes all tests, and leaves `.d.ts` unchanged. pnpm reports 0.151.0 as an unmet peer of `^0.145.0` but installs it.
- **Revisit when all of these hold:** the peer range is settled (vitejs/vite-plugin-react#1437); oxc-project/oxc#26519 (outlined-closure `ReferenceError`) and #26161 (BigInt literals) are fixed; and plugin-react/Oxc drop the experimental label. The diagnostics blocker oxc-project/oxc#26318 is closed: `oxc-transform-react` 0.152.0 adds `reactCompiler.reportDiagnostics`, not yet re-measured here. On adoption, re-verify memo caches, tests, and package output before removing the Babel dependencies.

## Pull Request Guidelines

- Keep each PR focused on a single feature or fix.
- Update documentation in **both** `README.md` **and** `README-zh_CN.md` (and `examples/`, API comments) when behavior or public APIs change.
- Add or update tests in `src/__tests__` for any logic changes.
- Ensure `vp check --deny-warnings` and `vp test` pass locally.
- Describe the motivation, solution, and validation steps in the PR body.
- **Add a changeset** (`vp run changeset`) for any user-visible change — pick `patch` for fixes, `minor` for additive features, `major` for breaking changes. Internal-only refactors that don't affect the published API may skip this with a note in the PR description.

## Releasing

Releases are driven by [changesets](https://github.com/changesets/changesets):

1. PRs include a `.changeset/*.md` file describing the change.
2. Pushes to `main` run `ci.yml`; a successful push-triggered run starts `release.yml`, which keeps an open release PR (titled `chore: release`, from `changeset-release/main`) or publishes a merged version bump via npm OIDC.
3. The release job continues only when `main`'s HEAD is the commit CI tested. If `main` has moved on, it skips and the newer push's CI run triggers the release, so an untested commit is never versioned or published.

Hotfixes follow the same flow. `changeset version` output (CHANGELOG / version bumps) belongs only in the auto-generated release PR, never in feature PRs.

The release PR needs one manual step. Changesets opens it with `GITHUB_TOKEN`, so GitHub parks its `pull_request` run in the `action_required` state: `test (24)` / `test (26)` never report, and because both are required the merge is refused with `405 2 of 2 required status checks are expected`. Anyone with write access can approve the parked run, then merge once it passes — choose **Approve and run** on the run (PR checks tab or Actions tab), or from the CLI:

```bash
gh run list --workflow CI --branch changeset-release/main --event pull_request --limit 1
gh api -X POST repos/chensid/react-use-echarts/actions/runs/<run-id>/approve
```

Nothing else unblocks it:

- `workflow_dispatch` on `changeset-release/main` does not help: on the 3.2.3 release PR (#594) the dispatched run's passing checks never appeared in the PR's check rollup.
- Do not push a throwaway commit to the release branch to start CI.
- The approval settings under Actions cover forks only, so no repository toggle removes this step (see [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request)). Creating the PR with a personal access token or GitHub App token would avoid it, at the cost of managing that credential.

## Reporting Issues

When filing an issue, please include:

- Version information: `react-use-echarts`, React, ECharts, Node.js.
- Clear steps to reproduce (ideally a minimal sandbox or code sample).
- Expected behavior and actual behavior.
- Any relevant logs, stack traces, or screenshots.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
