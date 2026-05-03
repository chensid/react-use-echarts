import type {
  EChartsOption,
  ECharts,
  SetOptionOpts,
  EChartsInitOpts as RawEChartsInitOpts,
  Payload,
} from "echarts";
import type { CSSProperties } from "react";

/**
 * Built-in theme names
 * 内置主题名称
 */
export type BuiltinTheme = "light" | "dark" | "macarons";

/**
 * Event handler signature. Params defaults to `any` so consumers can annotate
 * concrete ECharts event types (e.g. `ECElementEvent`) without casting.
 * 事件处理函数签名。参数默认为 `any`，便于使用方直接标注具体的 ECharts 事件类型。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see docstring
export type EChartsEventHandler<TParams = any> = (params: TParams) => void;

/**
 * Event configuration: shorthand function or full config object
 * 事件配置：简写函数或完整配置对象
 * @example
 * ```typescript
 * // Shorthand 简写
 * onEvents={{ click: (params) => console.log(params) }}
 * // Typed params 明确参数类型
 * onEvents={{ click: (params: ECElementEvent) => console.log(params.data) }}
 * // Full config 完整写法
 * onEvents={{ click: { handler: fn, query: 'series' } }}
 * ```
 */
export type EChartsEventConfig =
  | EChartsEventHandler
  | {
      handler: EChartsEventHandler;
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
export type EChartsInitOpts = Omit<RawEChartsInitOpts, "renderer" | "ssr">;

/**
 * Loading animation options for ECharts
 * ECharts 加载动画选项
 * @see https://echarts.apache.org/en/api.html#echartsInstance.showLoading
 */
export interface LoadingOption {
  /** Loading text. Default: 'loading' */
  text?: string;
  /** Loading animation color. Default: '#c23531' */
  color?: string;
  /** Text color. Default: '#000' */
  textColor?: string;
  /** Mask background color. Default: 'rgba(255, 255, 255, 0.8)' */
  maskColor?: string;
  /** Z-level of the loading component */
  zlevel?: number;
  /** Font size. Default: 12 */
  fontSize?: number;
  /** Whether to show spinner. Default: true */
  showSpinner?: boolean;
  /** Spinner radius. Default: 10 */
  spinnerRadius?: number;
  /** Spinner line width. Default: 5 */
  lineWidth?: number;
  /** Font weight */
  fontWeight?: string | number;
  /** Font style */
  fontStyle?: string;
  /** Font family */
  fontFamily?: string;
  /** Extensibility for custom loading types */
  [key: string]: unknown;
}

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
   * Theme. Accepts one of:
   * - a built-in name: `"light" | "dark" | "macarons"`
   * - any theme name already registered via `registerCustomTheme()` or `echarts.registerTheme()`
   *   — unknown strings silently fall back to the default theme (typos are NOT detected at runtime)
   * - a custom theme config object (auto-deduplicated by content hash)
   * - omit the field for the default theme
   *
   * 主题。可为：
   * - 内置主题名：`"light" | "dark" | "macarons"`
   * - 已通过 `registerCustomTheme()` 或 `echarts.registerTheme()` 注册过的任意主题名
   *   —— 未知字符串会静默回退到默认主题（运行时不会检测拼写错误）
   * - 自定义主题配置对象（按内容哈希自动去重）
   * - 省略字段表示默认主题
   */
  theme?: BuiltinTheme | (string & {}) | object;

  /**
   * Renderer type
   * 渲染器类型
   * @default 'canvas'
   */
  renderer?: "canvas" | "svg";

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
  loadingOption?: LoadingOption;

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
   * Without this: failures inside React effects are logged via console.error,
   * while imperative setOption calls throw.
   * 未提供时：React effect 内部失败通过 console.error 输出，
   * 命令式 setOption 调用失败则直接抛出异常。
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

  /**
   * Dispatch an ECharts action (e.g. highlight, downplay, showTip).
   * No-op when the instance is not initialized.
   * 派发 ECharts 动作（如 highlight、downplay、showTip）。实例未初始化时为 no-op。
   * Errors are routed through `onError` if provided; otherwise rethrown.
   * @see https://echarts.apache.org/en/api.html#echartsInstance.dispatchAction
   */
  dispatchAction: (
    payload: Payload,
    opt?: boolean | { silent?: boolean; flush?: boolean | undefined },
  ) => void;

  /**
   * Clear current chart content. No-op when the instance is not initialized.
   * 清空当前图表内容。实例未初始化时为 no-op。
   * @see https://echarts.apache.org/en/api.html#echartsInstance.clear
   */
  clear: () => void;
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
  style?: CSSProperties;

  /**
   * CSS class name for the container div
   * 容器 div 的 CSS 类名
   */
  className?: string;
}
