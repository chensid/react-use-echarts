"use client";

/**
 * react-use-echarts/preset-full
 *
 * Sugar entry that registers the full ECharts chart/component/renderer/feature
 * surface against the shared global registry. Call `registerEchartsFull()`
 * once at your application entry to get the equivalent of `import "echarts"`
 * with an explicit registry choice. The default package entry imports only
 * `echarts/core`, so consumers that skip this preset can keep selective builds
 * small instead of paying for the full ECharts surface.
 *
 * For tree-shake-friendly production builds, skip this and call
 * `echarts.use([...])` selectively with only the modules you render.
 *
 * react-use-echarts/preset-full 子入口 — 在应用入口调用一次
 * `registerEchartsFull()` 即可注册全套图表/组件/渲染器/特性，等价于
 * `import "echarts"` 的完整 registry。默认入口只导入 `echarts/core`，因此
 * 不使用此 preset 的应用仍可通过按需 `echarts.use([...])` 保持较小体积。
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
