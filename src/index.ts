"use client";

/**
 * react-use-echarts
 * A React hook library for Apache ECharts with TypeScript support
 * 基于 TypeScript 的 Apache ECharts React Hook 库
 *
 * @packageDocumentation
 */

/**
 * Main hook for using ECharts in React components
 * 在 React 组件中使用 ECharts 的主要 Hook
 *
 * Note: this entry is fully modular — it does not auto-register any echarts
 * chart/component/renderer/feature. Call `registerEchartsFull()` from the
 * `react-use-echarts/preset-full` subpath at your app entry for a zero-config
 * "everything" experience, or call `echarts.use([...])` selectively for
 * tree-shake-friendly production builds.
 *
 * 注意：此入口完全 modular，不会自动注册任何 echarts 图表/组件/渲染器/特性。
 * 应用入口可调用 `react-use-echarts/preset-full` 的 `registerEchartsFull()`
 * 获得开箱即用体验，或显式 `echarts.use([...])` 按需注册以利于 tree-shake。
 */
export { useEcharts } from "./hooks/use-echarts";

/**
 * Declarative EChart component
 * 声明式 EChart 组件
 */
export { EChart } from "./components/EChart";

/**
 * Lazy initialization hook
 * 懒加载初始化 Hook
 */
export { useLazyInit } from "./hooks/use-lazy-init";

/**
 * Type definitions for the library
 * 库的类型定义
 */
export type {
  UseEchartsOptions,
  UseEchartsReturn,
  UseLazyInitReturn,
  EChartsEvents,
  EChartsEventConfig,
  EChartsEventHandler,
  EChartsEventPayloadMap,
  EChartsInitOpts,
  EChartProps,
  EChartHandle,
  BuiltinTheme,
  LoadingOption,
  ChartFinder,
  ChartScaleValue,
} from "./types";

/**
 * Re-exported ECharts `Payload` type — useful when annotating arguments to
 * the imperative `dispatchAction` returned from `useEcharts`.
 * 转出的 ECharts `Payload` 类型，便于在调用 `dispatchAction` 时显式标注参数。
 */
export type { Payload } from "echarts/core";

/**
 * Theme utilities (lightweight, no JSON bundled)
 * 主题工具函数（轻量，不含 JSON）
 */
export { isBuiltinTheme, isKnownTheme, registerCustomTheme } from "./themes";

/**
 * Merge multiple React refs into one callback ref
 * 将多个 React ref 合并为单一 callback ref
 */
export { mergeRefs } from "./utils/merge-refs";
