import type { EChartsOption, ECharts, SetOptionOpts } from "echarts";

/**
 * Theme type for ECharts
 * ECharts 的主题类型
 */
export type Theme = string | object | null;

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
 * Configuration options for useECharts hook
 * useECharts hook 的配置选项
 */
export interface UseEChartsOptions {
  /**
   * ECharts configuration options
   * ECharts 的配置项
   */
  option: EChartsOption;
  /**
   * Theme to be applied
   * 要应用的主题
   */
  theme?: Theme;
  /**
   * Whether to not merge with previous options
   * 是否不合并之前的配置项
   * @default false
   */
  notMerge?: boolean;
  /**
   * Whether to update chart in lazy mode
   * 是否在懒加载模式下更新图表
   * @default false
   */
  lazyUpdate?: boolean;
  /**
   * Whether to show loading state
   * 是否显示加载状态
   * @default false
   */
  showLoading?: boolean;
  /**
   * Loading options
   * 加载配置项
   */
  loadingOption?: object;
  /**
   * Event configurations
   * 事件配置
   */
  onEvents?: EChartsEvents;
}

/**
 * Return type for useECharts hook
 * useECharts hook 的返回类型
 */
export interface UseEChartsReturn {
  /**
   * Reference to the chart container element
   * 图表容器元素的引用
   */
  chartRef: React.RefObject<HTMLDivElement>;
  /**
   * Function to update chart options
   * 更新图表配置的函数
   */
  setOption: (option: EChartsOption, opts?: SetOptionOpts) => void;
  /**
   * Function to get the ECharts instance
   * 获取 ECharts 实例的函数
   * @returns Returns the current ECharts instance, or undefined if not initialized
   */
  getInstance: () => ECharts | undefined;
}
