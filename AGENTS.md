# react-use-echarts — Agent Development Guide

> **Note:** `CLAUDE.md` is a symlink to this file. They are the same file.

## Project Overview

`react-use-echarts` is a React hooks library for Apache ECharts. It provides a `useEcharts` hook and a declarative `<EChart />` component. Built with TypeScript 6.0, Vite+ unified toolchain, tested with Vitest + Testing Library. Zero runtime dependencies beyond peer dependencies (`react`, `react-dom`, `echarts`).

- **Peer deps:** React 19.2+, ECharts 6.x
- **CSR only** — ECharts requires DOM access; SSR is not supported
- **Package manager:** pnpm (via `packageManager` field)
- **Build tool:** Vite+ (`vp`) for all development commands

## Vite+ Toolchain

This project uses **Vite+** (unified Web toolchain) via the global CLI `vp`. Vite+ bundles Vite, Rolldown, Vitest, tsdown, Oxlint, and Oxfmt into a single toolchain.

### Critical Rules

- **Always use `vp` commands** — never run `npm`, `pnpm`, or `yarn` directly for dev tasks
- **Never run `vp vitest` or `vp oxlint`** — the correct commands are `vp test` and `vp lint`
- **Import from `vite-plus`**, not from `vite` or `vitest`:
  ```ts
  import { defineConfig } from "vite-plus";
  import { expect, test, vi } from "vite-plus/test";
  ```
- **Do not install** Vitest, Oxlint, Oxfmt, or tsdown separately — they are built into vite-plus
- **Use `vp dlx`** instead of `npx` / `pnpm dlx`
- **Built-in commands take priority:** `vp dev` / `vp build` / `vp test` always run built-in tools, not `package.json` scripts of the same name. To run a custom script, use `vp run <script>`
- **Type-aware linting** works out of the box: `vp lint --type-aware` (no extra packages needed)

### Configuration

All tools are configured in `vite.config.ts` via extension blocks:

| Block    | Purpose              | Replaces                         |
| -------- | -------------------- | -------------------------------- |
| `test`   | Vitest configuration | `vitest.config.ts`               |
| `lint`   | Oxlint rules         | `.eslintrc` / `eslint.config.js` |
| `fmt`    | Oxfmt formatting     | `.prettierrc`                    |
| `pack`   | tsdown library build | `tsdown.config.ts`               |
| `staged` | Staged file checks   | `lint-staged` config             |
| `run`    | Task orchestration   | -                                |

### CI Integration

Uses [`voidzero-dev/setup-vp@v1`](https://github.com/voidzero-dev/setup-vp) GitHub Action, replacing separate setup-node, package manager, and cache steps.

> Full Vite+ agent guide: `node_modules/vite-plus/AGENTS.md`

## Commands

```bash
vp install                    # Install dependencies
vp dev                        # Dev server (localhost:3000, serves examples/)
vp build                      # Build examples app
vp pack                       # Library build → dist/
vp test                       # Vitest (watch mode)
vp test run                   # Single run
vp test src/__tests__/hooks/use-echarts.test.ts  # Single file
vp test run --coverage        # Coverage report (v8)
vp lint .                     # Oxlint
vp check                      # format + lint + typecheck
vp run typecheck              # tsc -b
```

**Pre-PR checklist:** `vp check && vp test run`

## Codebase Structure

```
src/
├── index.ts                    # Package entry, re-exports everything
├── components/EChart.tsx       # Declarative component wrapping useEcharts
├── hooks/
│   ├── use-echarts.ts          # Core hook (6 internal effects)
│   └── use-lazy-init.ts        # IntersectionObserver hook
├── themes/
│   ├── index.ts                # Lightweight theme utilities (no JSON)
│   ├── registry.ts             # Built-in theme registration (imports JSON)
│   └── presets/                # Built-in theme JSON (light/dark/macarons)
├── utils/
│   ├── instance-cache.ts       # WeakMap instance cache + reference counting
│   └── connect.ts              # Chart group linkage logic
├── types/index.ts              # All type definitions
└── __tests__/                  # Mirror structure: components/, hooks/, themes/, utils/
```

## Architecture

### useEcharts Internal Effects

The hook is split into 6 effects by responsibility:

1. **Instance Lifecycle** (`useLayoutEffect`) — reuse cached or create instance, initial setOption, events, loading, group
2. **Option Updates** (`useEffect`) — call `setOption` when option changes
3. **Loading State** (`useEffect`) — toggle loading
4. **Event Rebinding** (`useEffect`) — unbind old, bind new when `onEvents` changes
5. **Group Changes** (`useEffect`) — switch chart group dynamically
6. **Resize Observer** (`useEffect`) — create/destroy ResizeObserver

### Key Design Patterns

- **Ref passed in by caller** — hook does not create refs internally
- **WeakMap instance cache + reference counting** — supports React StrictMode double mount/unmount
- **initOpts stabilization** — serialized to stable key to prevent instance recreation from inline objects
- **Two-level theme cache** — custom theme objects auto-deduplicated
- **Memoized return value** — `useMemo` ensures referential stability of `{ setOption, getInstance, resize }`
- **React Compiler** — enabled via `@vitejs/plugin-react` + `@rolldown/plugin-babel` with `reactCompilerPreset()`

### Feature Notes

- **Chart linkage:** `group` field syncs tooltip/highlight across multiple charts
- **Lazy initialization:** IntersectionObserver defers init until element enters viewport
- **Auto-resize:** ResizeObserver automatically handles container dimension changes
- **Event rebinding:** `onEvents` supports shorthand functions and full config objects; auto-rebound on change
- **Error capture:** `onError` callback catches init/setOption exceptions

## Testing

- **Runner:** Vitest + jsdom, ECharts API fully mocked
- **Structure:** tests in `src/__tests__/` mirror `src/` layout
- **Shared mocks:** `createMockInstance`, `MockResizeObserver`, `MockIntersectionObserver` in `src/__tests__/helpers.ts`
- **Config:** `test` block in `vite.config.ts` — threads pool, `clearMocks` / `mockReset` / `restoreMocks` all enabled
- **Globals:** `globals: true` — test files import from `"vite-plus/test"` for type safety
- **TypeScript:** `tsconfig.test.json` extends `tsconfig.app.json` to cover test files (JSX support in IDE)

### Test Gotchas

- Always `vi.mock("echarts")` before importing modules that depend on echarts
- Mock instance shape must match `createMockInstance` from helpers (setOption, dispose, showLoading, hideLoading, on, off, getDom, resize)
- `MockIntersectionObserver.observe` triggers callback immediately with `isIntersecting: true`
- `testTimeout: 10000` is configured globally — avoid adding per-test timeouts unless necessary

## Development Workflow

1. `vp install` — install dependencies
2. Create branch: `git checkout -b feat/my-feature`
3. **Types first** — define types in `src/types/index.ts`
4. **Implement** — write code in `src/`
5. **Test** — add tests in `src/__tests__/` matching the source structure
6. **Manual verification** — `vp dev` serves `examples/` at localhost:3000
7. **Pre-PR check** — `vp check && vp test run`
8. **Update docs** — update `README.md` and `README-zh_CN.md` if public API changed

## Conventions

- **Commit format:** `feat|fix|docs|test|refactor|chore: <subject>`
- **Types-first workflow:** add types in `src/types/index.ts` before implementing
- **Paired cleanup:** all side effects must have cleanup functions
- **Build outputs:** `dist/index.js` (ESM), `dist/index.umd.js` (UMD), `dist/index.d.ts`
- **Library build:** `vp pack` (tsdown); examples build: `vp build` (Vite)
- **External peers:** react, react-dom, echarts are not bundled

## Anti-patterns

- **DO NOT** use `npm` / `pnpm` / `yarn` directly — always use `vp`
- **DO NOT** import from `"vite"` or `"vitest"` — use `"vite-plus"` / `"vite-plus/test"`
- **DO NOT** install Vitest, Oxlint, Oxfmt, or tsdown separately
- **DO NOT** use `npx` / `pnpm dlx` — use `vp dlx`
- **DO NOT** create effects without paired cleanup functions
- **DO NOT** pass un-memoized theme objects (the hook has a two-level cache as safety net, but callers should still use `useMemo`)
- **DO NOT** duplicate API reference from `README.md` into this file — read the source or README directly

## Troubleshooting

| Problem                          | Cause                                   | Fix                                                    |
| -------------------------------- | --------------------------------------- | ------------------------------------------------------ |
| Test fails: "echarts not mocked" | Missing `vi.mock("echarts")`            | Add mock before imports                                |
| Test lint errors                 | `tsconfig.test.json` not including file | Check `include` patterns                               |
| Build fails with `vp pack`       | External peer not configured            | Check `pack.outputOptions.globals` in `vite.config.ts` |
| StrictMode double-mount issues   | Instance cache refCount mismatch        | Check `src/utils/instance-cache.ts` logic              |
| Lint: `unbound-method` in tests  | Vitest mock methods                     | Already disabled via override in `vite.config.ts`      |
