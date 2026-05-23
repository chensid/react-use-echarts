/**
 * react-use-echarts/preset-full
 *
 * Sugar entry that registers the full ECharts chart/component/renderer/feature
 * surface against the shared global registry. Call `registerEchartsFull()`
 * once at your application entry to get the equivalent of `import "echarts"`
 * — same ~1MB bundle, same zero-config experience — without depending on
 * upstream ECharts' non-conforming `sideEffects` field, which production
 * minifiers (Rolldown/Oxc, Rollup, etc.) drop as pure.
 *
 * For tree-shake-friendly production builds, skip this and call
 * `echarts.use([...])` selectively with only the modules you render.
 *
 * react-use-echarts/preset-full 子入口 — 在应用入口调用一次
 * `registerEchartsFull()` 即可注册全套图表/组件/渲染器/特性，等价于
 * `import "echarts"` 但不依赖 ECharts 的副作用字段，在 Rolldown/Oxc 等现代
 * 打包器下可靠工作。生产环境建议改为按需 `echarts.use([...])`。
 *
 * @packageDocumentation
 */

import * as echarts from "echarts/core";
import * as Charts from "echarts/charts";
import * as Components from "echarts/components";
import * as Features from "echarts/features";
import * as Renderers from "echarts/renderers";

/**
 * Register all built-in ECharts charts, components, renderers and features.
 *
 * Idempotent: safe to call multiple times — ECharts' internal `use` already
 * deduplicates by reference. Call once at app entry, before the first
 * `useEcharts()` render.
 *
 * 一次性注册全部内置图表/组件/渲染器/特性。重复调用安全
 * （ECharts 内部已做去重）。建议在应用入口调用一次。
 */
export function registerEchartsFull(): void {
  echarts.use([
    ...Object.values(Renderers),
    ...Object.values(Charts),
    ...Object.values(Components),
    ...Object.values(Features),
  ] as unknown as Parameters<typeof echarts.use>[0]);
}
