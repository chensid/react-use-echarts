# Contributing to react-use-echarts

Thanks for your interest in improving `react-use-echarts`!

## Prerequisites

- Node.js 22 or newer (CI runs on 24.x)
- Vite+ CLI (`vp`) available in your shell
- Git

## Quick Start

1. Fork this repository and clone it locally.
2. Install dependencies: `vp install`.
3. Create a feature branch: `git checkout -b feat/my-feature`.
4. Start the playground for manual verification: `vp dev` (serves the examples on <http://localhost:3000>).
5. Implement and self-test your changes.

## Development Commands

- `vp dev` – run the Vite dev server with the examples under `examples/`.
- `vp lint .` – run Oxlint to check for issues.
- `vp check` – run format + lint + typecheck in one command.
- `vp run typecheck` – run dedicated TypeScript type validation (`tsc -b`).
- `vp test` – execute the Vitest suite (watch mode by default).
- `vp test run --coverage` – generate coverage reports.
- `vp build` – build the examples application with Vite.
- `vp pack` – build the library (ESM) and type declarations into `dist/`. Runs `publint` + `attw` automatically.

Run `vp check && vp test run` before opening a pull request. This is the same set of checks we rely on for releases.

## Pull Request Guidelines

- Keep each PR focused on a single feature or fix.
- Update documentation in **both** `README.md` **and** `README-zh_CN.md` (and `examples/`, API comments) when behavior or public APIs change.
- Add or update tests in `src/__tests__` for any logic changes.
- Ensure `vp check` and `vp test run` pass locally.
- Describe the motivation, solution, and validation steps in the PR body.
- **Add a changeset** (`pnpm changeset`) for any user-visible change — pick `patch` for fixes, `minor` for additive features, `major` for breaking changes. Internal-only refactors that don't affect the published API may skip this with a note in the PR description.

## Releasing

Releases are driven by [changesets](https://github.com/changesets/changesets):

1. PRs include a `.changeset/*.md` file describing the change.
2. Pushes to `main` keep an open "Version Packages" PR that aggregates pending changesets.
3. Merging that PR triggers `release.yml` to build, version, and publish via npm OIDC.

Hotfixes can bypass the queue by cutting a GitHub Release manually — that path runs `npm-publish.yml` (kept as a fallback). Don't include `changeset version` output (CHANGELOG / version bumps) in feature PRs; that belongs only in the auto-generated Version Packages PR.

## Reporting Issues

When filing an issue, please include:

- Version information: `react-use-echarts`, React, ECharts, Node.js.
- Clear steps to reproduce (ideally a minimal sandbox or code sample).
- Expected behavior and actual behavior.
- Any relevant logs, stack traces, or screenshots.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
