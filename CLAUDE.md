# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`react-use-echarts` is a React hooks library for Apache ECharts. It provides a `useEcharts` hook and a declarative `EChart` component. Built with TypeScript 5.9, Vite+ (vite-plus unified toolchain), tested with Vitest + Testing Library. Zero runtime dependencies beyond React 19 and ECharts 6. Package manager is **pnpm**.

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev server (localhost:3000, serves examples/)
pnpm build            # vp build (examples app)
pnpm pack:lib         # vp pack → dist/ (library build for npm)
pnpm test             # Vitest (watch mode by default)
pnpm test -- --run    # Single run
pnpm test -- src/__tests__/hooks/use-echarts.test.ts  # Run single test file
pnpm coverage         # Coverage report (v8)
pnpm lint             # Oxlint (via vp lint)
pnpm check            # vp check (lint + format + typecheck)
pnpm typecheck        # tsc -b
```

Pre-PR checklist: `pnpm check && pnpm test -- --run`

## Architecture

```
src/
├── index.ts                    # Package entry, re-exports everything
├── components/EChart.tsx       # Declarative component wrapping useEcharts
├── hooks/
│   ├── use-echarts.ts          # Core hook (6 internal effects, see below)
│   └── use-lazy-init.ts        # IntersectionObserver hook
├── themes/
│   ├── index.ts                # Theme registration & utilities
│   └── presets/                # Built-in theme JSON (light/dark/macarons)
├── utils/
│   ├── instance-cache.ts       # WeakMap instance cache + reference counting
│   └── connect.ts              # Chart group linkage logic
├── types/index.ts              # All type definitions
└── __tests__/                  # Mirror structure: components/, hooks/, themes/, utils/
```

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

## Testing

- Vitest + jsdom, ECharts API fully mocked
- Tests live in `src/__tests__/` mirroring `src/` structure
- Shared mocks (`createMockInstance`, `MockResizeObserver`, `MockIntersectionObserver`) in `src/__tests__/helpers.ts`
- Config: `test` block in `vite.config.ts` — threads pool, clearMocks/mockReset/restoreMocks all enabled
- `globals: true` — test files import from `"vite-plus/test"` for type safety
- TypeScript: `tsconfig.test.json` extends `tsconfig.app.json` to cover test files (JSX support in IDE)

## Conventions

- Commit format: `feat|fix|docs|test|refactor|chore: <subject>`
- New features: add types in `src/types/index.ts` first, then implement, test, update README
- All side effects must have paired cleanup functions
- Build outputs: `dist/index.js` (ESM), `dist/index.umd.js` (UMD), `dist/index.d.ts`
- Library built via `vp pack` (tsdown); examples app built via `vp build` (Vite)
- External peers (not bundled): react, react-dom, echarts
- Vite+ (vite-plus) unified toolchain; React Compiler via `@rolldown/plugin-babel`
