"use client";

/**
 * react-use-echarts/core
 *
 * @deprecated Since v2.1 this entry is a plain alias of the default
 * `react-use-echarts` entry — both are now fully modular. Migrate to the
 * default entry. This alias will be removed in v4.
 *
 * Background: in v2.0 the default entry side-effect-imported `"echarts"` and
 * `/core` was the opt-out. In v2.1 the default entry stopped doing that
 * (because production minifiers like Rolldown/Oxc drop echarts' top-level
 * registrations as pure), so `/core` and the default entry now have identical
 * behavior. Register the modules you need either via `echarts.use([...])` or
 * via `registerEchartsFull()` from `react-use-echarts/preset-full`.
 *
 * @deprecated v2.1 起此入口与默认 `react-use-echarts` 入口完全等价（默认入口
 * 也已 modular 化）。请改用默认入口，本别名将在 v4 移除。
 *
 * Implemented as a single `export *` re-export so the two entries cannot drift:
 * every value and type exported from `./index` is forwarded verbatim. The
 * `core.test.ts` drift-guard asserts `Object.keys` parity between the two.
 * 以单条 `export *` 转发，确保两入口不会分叉；core.test.ts 守卫二者 key 一致。
 *
 * @packageDocumentation
 */

export * from "./index";
