import type { EChartsOption, ECharts, SetOptionOpts, EChartsInitOpts as RawEChartsInitOpts } from "echarts";

/**
 * Built-in theme names
 * 内置主题名称
 */
export type BuiltinTheme = 'light' | 'dark' | 'macarons';

/**
 * Event configuration: shorthand function or full config object
 * 事件配置：简写函数或完整配置对象
 * @example
 * ```typescript
 * // Shorthand 简写
 * onEvents={{ click: (params) => console.log(params) }}
 * // Full config 完整写法
 * onEvents={{ click: { handler: fn, query: 'series' } }}
 * ```
 */
export type EChartsEventConfig =
  | ((params: unknown) => void)
  | {
      handler: (params: unknown) => void;
      query?: string | object;
      context?: object;
    };

/**
 * Event configuration interface for ECharts
 * ECharts 事件配置接口
 * @example
 * ```typescript
 * const events: EChartsEvents = {
 *   'click': (params) => console.log('clicked', params),
 *   'mouseover': {
 *     handler: (params) => console.log('hovered', params),
 *     query: 'series',
 *   }
 * }
 * ```
 */
export interface EChartsEvents {
  /**
   * Event name as key, value can be a handler function or full config
   * 事件名称作为键，值可以是处理函数或完整配置
   */
  [eventName: string]: EChartsEventConfig;
}

/**
 * ECharts initialization options passed to echarts.init()
 * 传递给 echarts.init() 的初始化选项
 *
 * Derived from ECharts' own type, excluding `renderer` (separate hook param)
 * and `ssr` (not applicable in React hook context).
 * 派生自 ECharts 官方类型，排除 renderer（Hook 独立参数）和 ssr（Hook 场景不适用）。
 *
 * @see https://echarts.apache.org/en/api.html#echarts.init
 */
export type EChartsInitOpts = Omit<RawEChartsInitOpts, 'renderer' | 'ssr'>;

/**
 * Configuration options for useEcharts hook
 * useEcharts hook 的配置选项
 */
export interface UseEchartsOptions {
  /**
   * ECharts configuration options
   * ECharts 配置项
   */
  option: EChartsOption;

  /**
   * Theme: built-in preset name | custom object | null
   * 主题：内置预设名 | 自定义对象 | null
   */
  theme?: BuiltinTheme | object | null;

  /**
   * Renderer type
   * 渲染器类型
   * @default 'canvas'
   */
  renderer?: 'canvas' | 'svg';

  /**
   * Lazy initialization: only init when container enters viewport
   * 懒加载：仅当容器进入视口时初始化
   */
  lazyInit?: boolean | IntersectionObserverInit;

  /**
   * Chart group ID for linkage
   * 图表组 ID，用于联动
   */
  group?: string;

  /**
   * Default setOption options
   * setOption 默认选项（替代原 notMerge / lazyUpdate）
   */
  setOptionOpts?: SetOptionOpts;

  /**
   * Whether to show loading state
   * 是否显示加载状态
   * @default false
   */
  showLoading?: boolean;

  /**
   * Loading options
   * 加载配置项
   * @see https://echarts.apache.org/en/api.html#echartsInstance.showLoading
   */
  loadingOption?: Record<string, unknown>;

  /**
   * Event configurations
   * 事件配置
   */
  onEvents?: EChartsEvents;

  /**
   * Whether to automatically resize chart when container size changes
   * 容器尺寸变化时是否自动 resize
   * @default true
   */
  autoResize?: boolean;

  /**
   * ECharts init options (devicePixelRatio, locale, width, height, useDirtyRect, useCoarsePointer, pointerSize)
   * ECharts 初始化选项
   * Note: Changing these requires instance recreation
   */
  initOpts?: EChartsInitOpts;

  /**
   * Error handler for chart operations (init, setOption, etc.)
   * 图表操作（init、setOption 等）的错误处理回调
   * Without this, errors propagate normally (may trigger React error boundaries)
   */
  onError?: (error: unknown) => void;
}

/**
 * Return type for useEcharts hook
 * useEcharts hook 的返回类型
 */
export interface UseEchartsReturn {
  /**
   * Function to update chart options
   * 动态更新配置
   */
  setOption: (option: EChartsOption, opts?: SetOptionOpts) => void;

  /**
   * Function to get the ECharts instance
   * 获取实例
   * @returns Returns the current ECharts instance, or undefined if not initialized
   */
  getInstance: () => ECharts | undefined;

  /**
   * Manually trigger resize
   * 手动触发 resize
   */
  resize: () => void;
}

/**
 * Props for the EChart declarative component
 * EChart 声明式组件的属性
 */
export interface EChartProps extends UseEchartsOptions {
  /**
   * Inline style for the container div
   * 容器 div 的内联样式
   */
  style?: React.CSSProperties;

  /**
   * CSS class name for the container div
   * 容器 div 的 CSS 类名
   */
  className?: string;
}
