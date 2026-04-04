# react-use-echarts — Development Guide

React hooks library for Apache ECharts. Hook + declarative component, TypeScript, zero runtime deps.

- **Peer deps:** React 19.2+, ECharts 6.x | **CSR only** | **Package manager:** pnpm

## Vite+ Toolchain

> Full rules and common pitfalls: `node_modules/vite-plus/AGENTS.md`

Project-specific commands:

```bash
vp install                    # Install dependencies
vp dev                        # Dev server (localhost:3000, serves examples/)
vp build                      # Build examples app
vp pack                       # Library build → dist/
vp test                       # Vitest (watch mode)
vp test run                   # Single run
vp test run --coverage        # Coverage report (v8)
vp lint .                     # Oxlint
vp check                      # format + lint + typecheck
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

### useEcharts — 6 Effects by Responsibility

1. **Instance Lifecycle** (`useLayoutEffect`) — reuse cached or create instance, initial setOption, events, loading, group
2. **Option Updates** (`useEffect`) — call `setOption` when option changes
3. **Loading State** (`useEffect`) — toggle loading
4. **Event Rebinding** (`useEffect`) — unbind old, bind new when `onEvents` changes
5. **Group Changes** (`useEffect`) — switch chart group dynamically
6. **Resize Observer** (`useEffect`) — create/destroy ResizeObserver

### Key Design Patterns

- Ref passed in by caller — hook does not create refs internally
- WeakMap instance cache + reference counting — supports StrictMode double mount/unmount
- initOpts serialized to stable key — prevents instance recreation from inline objects
- Two-level theme cache — custom theme objects auto-deduplicated
- Memoized return value — `useMemo` ensures referential stability
- React Compiler enabled via `@vitejs/plugin-react` + `@rolldown/plugin-babel`

## Testing

- Vitest + jsdom, ECharts API fully mocked
- Tests in `src/__tests__/` mirror `src/` layout
- Shared mocks in `src/__tests__/helpers.ts`: `createMockInstance`, `MockResizeObserver`, `MockIntersectionObserver`
- Config: `test` block in `vite.config.ts` — `clearMocks` / `mockReset` / `restoreMocks` all enabled
- `globals: true` — import from `"vite-plus/test"` for type safety

### Test Gotchas

- Always `vi.mock("echarts")` before importing modules that depend on echarts
- Mock instance shape must match `createMockInstance` from helpers
- `MockIntersectionObserver.observe` triggers callback immediately with `isIntersecting: true`

## Conventions

- **Commit format:** `feat|fix|docs|test|refactor|chore: <subject>`
- **Types-first:** define types in `src/types/index.ts` before implementing
- **Paired cleanup:** all side effects must have cleanup functions
- **Build outputs:** `dist/index.js` (ESM), `dist/index.umd.js` (UMD), `dist/index.d.ts`, `dist/themes/registry.js` + `.d.ts` (theme subpath)

## Anti-patterns

- **DO NOT** create effects without paired cleanup functions
- **DO NOT** pass un-memoized theme objects (two-level cache is a safety net, not a guarantee)
- **DO NOT** duplicate API reference from `README.md` into this file

## Troubleshooting

| Problem                          | Cause                            | Fix                                                    |
| -------------------------------- | -------------------------------- | ------------------------------------------------------ |
| Test fails: "echarts not mocked" | Missing `vi.mock("echarts")`     | Add mock before imports                                |
| Test lint errors                 | `tsconfig.test.json` not correct | Check `include` patterns                               |
| Build fails with `vp pack`       | External peer not configured     | Check `pack.outputOptions.globals` in `vite.config.ts` |
| StrictMode double-mount issues   | Instance cache refCount mismatch | Check `src/utils/instance-cache.ts` logic              |
