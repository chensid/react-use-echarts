import type {
  ECharts,
  SetOptionOpts,
  EChartsInitOpts as RawEChartsInitOpts,
  Payload,
  ResizeOpts,
  ECElementEvent,
  SelectChangedPayload,
  HighlightPayload,
  DownplayPayload,
  AxisBreakChangedEvent,
  CollapseAxisBreakPayload,
  ExpandAxisBreakPayload,
  ToggleAxisBreakPayload,
} from "echarts/core";
// EChartsOption is the full pre-composed option type; only the full "echarts"
// package exports it (echarts/core ships ComposeOption / EChartsCoreOption).
import type { EChartsOption } from "echarts";
import type { CSSProperties, RefCallback } from "react";

/**
 * Model finder accepted by `convertToPixel` / `convertFromPixel` / `containPixel`.
 * Either a string shorthand (e.g. `"series"`) or a finder object such as
 * `{ seriesIndex: 0 }`. Extracted from echarts' single-signature `containPixel`
 * so the public type stays in sync without importing internal aliases.
 * convertToPixel/convertFromPixel/containPixel 接受的查询条件。可以是字符串简写
 * （如 "series"）或包含索引/ID/名称的查询对象。从单签名的 containPixel 提取以避免
 * 引用 echarts 的内部别名。
 */
export type ChartFinder = Parameters<ECharts["containPixel"]>[0];

/**
 * Scalar data value accepted by `convertToPixel`. Mirrors echarts' internal
 * `ScaleDataValue` (a number, ordinal string, or Date). The value parameter
 * itself is `ChartScaleValue | ChartScaleValue[]` — single value, axis pair,
 * or higher-rank tuple.
 * convertToPixel 接受的单个标量数据值。镜像 echarts 内部的 ScaleDataValue 类型。
 */
export type ChartScaleValue = number | string | Date;

/**
 * Built-in theme names
 * 内置主题名称
 */
export type BuiltinTheme = "light" | "dark" | "macarons";

/**
 * Event handler signature. Default param type is `unknown`; known echarts
 * events (see `EChartsEventPayloadMap`) get their concrete payload type
 * inferred automatically via the `EChartsEvents` mapped type.
 * 事件处理函数签名。默认参数类型为 `unknown`；已知 echarts 事件的具体 payload 类型
 * 通过 `EChartsEvents` 自动推导，详见 `EChartsEventPayloadMap`。
 */
export type EChartsEventHandler<TParams = unknown> = (params: TParams) => void;

/**
 * Event configuration: shorthand function or full config object.
 * 事件配置：简写函数或完整配置对象。
 * @example
 * ```typescript
 * // Shorthand — `params` is auto-typed for known events:
 * onEvents={{ click: (params) => console.log(params.data) }}    // params: ECElementEvent
 * // Full config 完整写法:
 * onEvents={{ click: { handler: fn, query: 'series' } }}
 * ```
 */
export type EChartsEventConfig<TParams = unknown> =
  | EChartsEventHandler<TParams>
  | {
      readonly handler: EChartsEventHandler<TParams>;
      readonly query?: string | object;
      readonly context?: object;
    };

/**
 * Map known echarts event names to their payload types.
 * 将已知 echarts 事件名映射到对应的 payload 类型。
 *
 * Used by `EChartsEvents` to give handlers a concrete payload type at the
 * call site without consumers having to import echarts internal types.
 * Unlisted events fall through to the open index-signature fallback in
 * `EChartsEvents` (typed as `any`).
 *
 * Augmentable from consumer code:
 * 可由使用方进行 module augmentation 扩展：
 * ```typescript
 * declare module "react-use-echarts" {
 *   interface EChartsEventPayloadMap {
 *     "my-custom-action": { foo: number };
 *   }
 * }
 * ```
 */
export interface EChartsEventPayloadMap {
  // Mouse events (ZRElementEventName from zrender)
  click: ECElementEvent;
  dblclick: ECElementEvent;
  mousedown: ECElementEvent;
  mousemove: ECElementEvent;
  mouseup: ECElementEvent;
  mouseover: ECElementEvent;
  mouseout: ECElementEvent;
  globalout: ECElementEvent;
  contextmenu: ECElementEvent;

  // Selection lifecycle
  selectchanged: SelectChangedPayload;
  highlight: HighlightPayload;
  downplay: DownplayPayload;

  // Axis break
  axisbreakchanged: AxisBreakChangedEvent;
  collapseAxisBreak: CollapseAxisBreakPayload;
  expandAxisBreak: ExpandAxisBreakPayload;
  toggleAxisBreak: ToggleAxisBreakPayload;
}

type KnownEChartsEvents = {
  [K in keyof EChartsEventPayloadMap]?: EChartsEventConfig<EChartsEventPayloadMap[K]>;
};

/**
 * Event configuration map for ECharts.
 * ECharts 事件配置映射。
 *
 * Known event names (see `EChartsEventPayloadMap`) get their payload type
 * inferred automatically; unlisted names (custom events from
 * `echarts.registerAction`) fall back to the open index signature.
 * 已知事件名（见 `EChartsEventPayloadMap`）的 payload 类型自动推导；
 * 自定义事件（如通过 `echarts.registerAction` 注册）回退到开放索引签名。
 *
 * @example
 * ```typescript
 * const events: EChartsEvents = {
 *   click: (params) => console.log(params.data),                  // params: ECElementEvent
 *   selectchanged: (params) => console.log(params.fromAction),    // params: SelectChangedPayload
 *   mouseover: { handler: (e) => console.log(e), query: "series" },
 * };
 * ```
 */
export interface EChartsEvents extends KnownEChartsEvents {
  // Open fallback for custom event names. `any` keeps the index-signature
  // variance compatible with the typed known events above; consumers can
  // narrow per-event with an explicit handler parameter type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [eventName: string]: EChartsEventConfig<any> | undefined;
}

/**
 * Return type for `useLazyInit` — a callback ref plus a reactive
 * visibility flag. Attach `ref` to the element you want to lazy-init,
 * then gate work on `isInView`.
 * `useLazyInit` 返回类型：callback ref + 响应式可见性标志。
 *
 * @example
 * ```tsx
 * const { ref, isInView } = useLazyInit({ rootMargin: "100px" });
 * return <div ref={ref}>{isInView ? <Chart /> : null}</div>;
 * ```
 */
export interface UseLazyInitReturn {
  /** Callback ref to attach to the element you want to lazily initialize. */
  ref: RefCallback<Element>;
  /** Whether the element is currently in (or past) the viewport. */
  isInView: boolean;
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
 *
 * Prefer the declarative props (`option`, `theme`, `showLoading`, etc.) over
 * imperative methods. Use these methods only for actions not covered by props,
 * such as exporting an image or coordinate conversion.
 * 优先使用声明式 props（option、theme、showLoading 等）；命令式方法仅在 props
 * 未覆盖的场景下使用，例如导出图片、坐标转换等。
 *
 * All methods are no-ops (or return safe defaults) when the instance is not
 * yet initialized. When the instance throws, errors are routed through
 * `onError` if provided (the call returns the fallback value); otherwise
 * the error is rethrown — including from readers, which never emit a
 * console.error fallback.
 * 所有方法在实例未初始化时为 no-op（或返回安全默认值）。实例抛出错误时：
 * 提供 onError 时路由并返回默认值；未提供 onError 时直接重新抛出，包括读取方法
 * （不会回退到 console.error）。
 */
export interface UseEchartsReturn {
  /**
   * Callback ref to attach to the chart container element.
   * 用于挂载到图表容器元素上的 callback ref。
   * @example
   * ```tsx
   * const { ref } = useEcharts({ option });
   * return <div ref={ref} style={{ width: "100%", height: 400 }} />;
   * ```
   */
  ref: RefCallback<HTMLDivElement>;

  /**
   * The live ECharts instance, or `undefined` before initialization
   * completes / after disposal. Reactive — components re-render when the
   * instance is created or torn down, so downstream effects can subscribe
   * via `useEffect([instance])`.
   * 当前 ECharts 实例；初始化未完成或已销毁时为 undefined。响应式 —
   * 实例创建/销毁会触发 re-render，下游 effect 可通过 `useEffect([instance])` 订阅。
   */
  instance: ECharts | undefined;

  /**
   * Function to update chart options
   * 动态更新配置
   */
  setOption: (option: EChartsOption, opts?: SetOptionOpts) => void;

  /**
   * Manually trigger resize. When opts is provided, ECharts uses it to override
   * the auto-detected container size and animation settings.
   * 手动触发 resize。传入 opts 时可覆盖自动测量的尺寸与动画。
   * @see https://echarts.apache.org/en/api.html#echartsInstance.resize
   */
  resize: (opts?: ResizeOpts) => void;

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

  /**
   * Get the current ECharts option object.
   * 获取当前完整配置项。
   * @returns The merged option, or `undefined` when the instance is not initialized.
   * @see https://echarts.apache.org/en/api.html#echartsInstance.getOption
   */
  getOption: () => EChartsOption | undefined;

  /**
   * Get the current width of the chart container in pixels.
   * 获取图表容器当前宽度（像素）。
   */
  getWidth: () => number | undefined;

  /**
   * Get the current height of the chart container in pixels.
   * 获取图表容器当前高度（像素）。
   */
  getHeight: () => number | undefined;

  /**
   * Get the underlying DOM container element used by the chart.
   * 获取图表底层 DOM 容器节点。
   */
  getDom: () => HTMLElement | undefined;

  /**
   * Whether the underlying ECharts instance has been disposed.
   * Returns `true` when there is no instance (effectively disposed).
   * 实例是否已被销毁；当实例不存在时返回 true（视作已销毁）。
   */
  isDisposed: () => boolean;

  /**
   * Get a base64 data URL of the chart image.
   * 导出图表图片的 base64 data URL。
   * @see https://echarts.apache.org/en/api.html#echartsInstance.getDataURL
   */
  getDataURL: (opts?: Parameters<ECharts["getDataURL"]>[0]) => string | undefined;

  /**
   * Get a base64 data URL of the connected (linked) chart group as a single image.
   * 导出整个连接组的合成图片 data URL。
   * @see https://echarts.apache.org/en/api.html#echartsInstance.getConnectedDataURL
   */
  getConnectedDataURL: (opts?: Parameters<ECharts["getConnectedDataURL"]>[0]) => string | undefined;

  /**
   * Render the chart to an SVG string. Useful with the SVG renderer.
   * 将图表渲染为 SVG 字符串。
   * @see https://echarts.apache.org/en/api.html#echartsInstance.renderToSVGString
   */
  renderToSVGString: (opts?: Parameters<ECharts["renderToSVGString"]>[0]) => string | undefined;

  /**
   * Get the SVG data URL of the current chart.
   * 获取当前图表的 SVG data URL。
   */
  getSvgDataURL: () => string | undefined;

  /**
   * Convert a value from logical coordinates to pixel coordinates.
   * 将逻辑坐标值转换为像素坐标。
   * @see https://echarts.apache.org/en/api.html#echartsInstance.convertToPixel
   */
  convertToPixel: (
    finder: ChartFinder,
    value: ChartScaleValue | ChartScaleValue[],
  ) => number | number[] | undefined;

  /**
   * Convert a value from pixel coordinates to logical coordinates.
   * 将像素坐标值转换为逻辑坐标。
   * @see https://echarts.apache.org/en/api.html#echartsInstance.convertFromPixel
   */
  convertFromPixel: (
    finder: ChartFinder,
    value: number | number[],
  ) => number | number[] | undefined;

  /**
   * Whether the given pixel point is inside the specified component.
   * Returns `false` when the instance is not initialized (no component contains it).
   * 给定像素点是否落在指定组件内；实例未初始化时返回 false。
   * @see https://echarts.apache.org/en/api.html#echartsInstance.containPixel
   */
  containPixel: (finder: ChartFinder, value: number[]) => boolean;

  /**
   * Append data to a series; useful for streaming. After a successful append,
   * the chart's data has drifted from the declarative `option` — the next
   * shallow-equal-but-new-reference `option` rerender re-applies setOption to
   * resync.
   * 向 series 追加数据，常用于流式更新。追加后内部数据会与声明式 option 偏离，
   * 下一次浅相等但新引用的 option rerender 会重新应用 setOption 进行同步。
   * @see https://echarts.apache.org/en/api.html#echartsInstance.appendData
   */
  appendData: (params: Parameters<ECharts["appendData"]>[0]) => void;
}

/**
 * Imperative handle exposed by `<EChart ref={…} />`.
 * Mirrors `UseEchartsReturn` without the `ref` field — the component
 * manages its own container ref internally, so consumers should not be
 * able to reassign the chart's DOM element through the imperative handle.
 * EChart 组件 imperative handle 的类型：与 useEcharts 返回值一致，但不包含 `ref` 字段
 *（组件内部自管容器 ref，外部不应通过 handle 重定向 DOM 元素）。
 */
export type EChartHandle = Omit<UseEchartsReturn, "ref">;

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
