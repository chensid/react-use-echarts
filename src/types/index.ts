import type { EChartsOption, ECharts, SetOptionOpts, EChartsInitOpts as RawEChartsInitOpts } from "echarts";

/**
 * Built-in theme names
 * 内置主题名称
 */
export type BuiltinTheme = 'light' | 'dark' | 'macarons';

/**
 * Event configuration interface for ECharts
 * ECharts 事件配置接口
 * @example
 * ```typescript
 * const events: EChartsEvents = {
 *   'click': {
 *     handler: (params) => console.log('clicked', params),
 *     query: '.series-name',
 *     context: this
 *   }
 * }
 * ```
 */
export interface EChartsEvents {
  /**
   * Event name as key
   * 事件名称作为键
   */
  [eventName: string]: {
    /**
     * Event handler function
     * 事件处理函数
     */
    handler: (params: unknown) => void;
    /**
     * Query condition for the event
     * 事件的查询条件
     * @see https://echarts.apache.org/en/api.html#bindbindEvent query
     */
    query?: string | object;
    /**
     * Context for the event handler
     * 事件处理函数的上下文
     */
    context?: object;
  };
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
