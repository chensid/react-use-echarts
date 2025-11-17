# Contributing to react-use-echarts

Thanks for your interest in improving `react-use-echarts`!

## Prerequisites

- Node.js 22.x (active LTS; required for the current Vite toolchain)
- pnpm ≥ 10
- Git

## Quick Start

1. Fork this repository and clone it locally.
2. Install dependencies: `pnpm install`.
3. Create a feature branch: `git checkout -b feat/my-feature`.
4. Start the playground for manual verification: `pnpm dev` (serves the examples on <http://localhost:3000>).
5. Implement and self-test your changes.

## Development Commands

- `pnpm dev` – run the Vite dev server with the examples under `examples/`.
- `pnpm lint` – run ESLint (auto-fix issues where possible).
- `pnpm typecheck` – validate TypeScript types.
- `pnpm test` – execute the Vitest suite (`pnpm test -- --watch` for watch mode).
- `pnpm coverage` – generate coverage reports.
- `pnpm build` – build the library bundles and type declarations into `dist/`.

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before opening a pull request. This is the same set of checks we rely on for releases.

## Pull Request Guidelines

- Keep each PR focused on a single feature or fix.
- Update documentation (`README.md`, `examples/`, API comments) when behavior or public APIs change.
- Add or update tests in `src/__tests__` for any logic changes.
- Ensure `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass locally.
- Describe the motivation, solution, and validation steps in the PR body.

## Reporting Issues

When filing an issue, please include:

- Version information: `react-use-echarts`, React, ECharts, Node.js.
- Clear steps to reproduce (ideally a minimal sandbox or code sample).
- Expected behavior and actual behavior.
- Any relevant logs, stack traces, or screenshots.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
