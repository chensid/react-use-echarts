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
 */
export { default as useEcharts } from "./hooks/use-echarts";

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
  Theme,
  BuiltinTheme,
} from "./types";

/**
 * Theme utilities
 * 主题工具函数
 */
export {
  registerBuiltinThemes,
  getBuiltinTheme,
  isBuiltinTheme,
  registerCustomTheme,
  getAvailableThemes,
} from "./themes";

/**
 * Utility functions for ECharts
 * ECharts 工具函数
 */
export * from "./utils";
