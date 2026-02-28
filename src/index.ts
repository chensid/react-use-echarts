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
  EChartsInitOpts,
  EChartProps,
  BuiltinTheme,
} from "./types";

/**
 * Theme utilities
 * 主题工具函数
 */
export {
  registerBuiltinThemes,
  ensureBuiltinThemesRegistered,
  getBuiltinTheme,
  isBuiltinTheme,
  registerCustomTheme,
  getAvailableThemes,
} from "./themes";

/**
 * Instance cache utilities (advanced)
 * 实例缓存工具（高级用法）
 */
export {
  getCachedInstance,
  setCachedInstance,
  replaceCachedInstance,
  releaseCachedInstance,
  getReferenceCount,
  clearInstanceCache,
} from "./utils/instance-cache";

/**
 * Chart group/linkage utilities (advanced)
 * 图表联动工具（高级用法）
 */
export {
  addToGroup,
  removeFromGroup,
  updateGroup,
  getGroupInstances,
  getInstanceGroup,
  isInGroup,
  clearGroups,
} from "./utils/connect";
