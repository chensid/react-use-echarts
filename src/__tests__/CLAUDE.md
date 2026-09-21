# `src/__tests__` — Test Notes

> Loaded when working under `src/__tests__/`. Project layout, coverage thresholds, and the `vitest`-import prohibition live in the root `CLAUDE.md`.

- Shared mocks in `src/__tests__/helpers.ts`: `createMockInstance`, `MockResizeObserver`, `MockIntersectionObserver`; import test APIs from `"vite-plus/test"` (`globals: true`)

## Test Gotchas

- In unit/happy-dom tests, `vi.mock("echarts/core")` before importing modules that depend on ECharts; browser tests intentionally import and register real ECharts modules
- Mock instance shape must match `createMockInstance` from helpers
- `MockIntersectionObserver.observe` triggers callback immediately with `isIntersecting: true`
