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
 * @packageDocumentation
 */

/**
 * Main hook for using ECharts in React components
 * 在 React 组件中使用 ECharts 的主要 Hook
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
