"use client";

/**
 * react-use-echarts/core
 * Tree-shakable entry. Identical public API to the default entry, but does
 * NOT import `"echarts"` for its side-effect registration of every chart and
 * component. Consumers register only what they need:
 *
 * ```ts
 * import * as echarts from "echarts/core";
 * import { LineChart } from "echarts/charts";
 * import { GridComponent } from "echarts/components";
 * import { CanvasRenderer } from "echarts/renderers";
 * echarts.use([LineChart, GridComponent, CanvasRenderer]);
 *
 * import { useEcharts } from "react-use-echarts/core";
 * ```
 *
 * react-use-echarts 的 tree-shakable 子入口。与默认入口 API 完全一致，但不会
 * 副作用 import `"echarts"`，由使用方按需 `echarts.use([...])` 注册图表/组件。
 *
 * @packageDocumentation
 */

/**
 * Main hook for using ECharts in React components
 * 在 React 组件中使用 ECharts 的主要 Hook
 */
export { default as useEcharts } from "./hooks/use-echarts";

/**
 * Declarative EChart component
 * 声明式 EChart 组件
 */
export { default as EChart } from "./components/EChart";

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
  EChartsEvents,
  EChartsEventConfig,
  EChartsEventHandler,
  EChartsInitOpts,
  EChartProps,
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
export type { Payload } from "echarts";

/**
 * Theme utilities (lightweight, no JSON bundled)
 * 主题工具函数（轻量，不含 JSON）
 */
export { isBuiltinTheme, isKnownTheme, registerCustomTheme } from "./themes";
