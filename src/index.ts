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
export { default as useEcharts } from './hooks/use-echarts';

/**
 * Type definitions for the library
 * 库的类型定义
 */
export type {
  UseEchartsOptions,
  UseEchartsReturn,
  EChartsEvents,
  Theme
} from './types';

/**
 * Utility functions for ECharts
 * ECharts 工具函数
 */
export * from './utils';