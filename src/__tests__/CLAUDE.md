# `src/__tests__` — Test Notes

> Loaded when working under `src/__tests__/`. Project layout, coverage thresholds, and the `vitest`-import prohibition live in the root `CLAUDE.md`.

- Shared mocks in `src/__tests__/helpers.ts`: `createMockInstance`, `MockResizeObserver`, `MockIntersectionObserver`, `boundProxy` (the proxy the hook bound via `on(eventName, …)` — `onEvents` binds proxies, so invoke this instead of matching the consumer's handler), and `withNodeEnv` (sets `process.env.NODE_ENV` for a sync block and restores it in `finally`); import test APIs from `"vite-plus/test"` explicitly (the projects set `globals: true`, but no test file uses the bare globals)

## Test Gotchas

- Most unit/happy-dom tests mock the module with `vi.mock("echarts/core", …)` (hoisted, so it sits below the imports); any test that would reach `echarts.init` must. A few files that only handle mock instances or never touch a chart (e.g. `utils/instance-cache.test.ts`, `types/public-api.test.ts`) load the real `echarts/core` unmocked. Browser tests intentionally import and register real ECharts modules
- Mock instance shape must match `createMockInstance` from helpers
- `MockIntersectionObserver.observe` (from `helpers.ts`) triggers callback immediately with `isIntersecting: true`; `hooks/use-lazy-init.test.ts` defines a local class of the same name that only fires when the test calls the captured callback
