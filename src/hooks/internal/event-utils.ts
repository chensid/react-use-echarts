import type { ECharts } from "echarts";
import type { EChartsEvents, EChartsEventConfig, EChartsEventHandler } from "../../types";

/**
 * Normalize event config to full object form
 * 将事件配置标准化为完整对象形式
 */
function normalizeEventConfig(config: EChartsEventConfig): {
  handler: EChartsEventHandler;
  query?: string | object;
  context?: object;
} {
  if (typeof config === "function") {
    return { handler: config };
  }
  return config;
}

/**
 * Bind events to ECharts instance
 * 绑定事件到 ECharts 实例
 */
export function bindEvents(instance: ECharts, events: EChartsEvents | undefined): void {
  if (!events) return;
  for (const [eventName, config] of Object.entries(events)) {
    const { handler, query, context } = normalizeEventConfig(config);
    if (query !== undefined) {
      instance.on(eventName, query, handler, context);
    } else {
      instance.on(eventName, handler, context);
    }
  }
}

/**
 * Compare two event config values for equality.
 * Reads handler/query/context directly without allocating normalized objects;
 * shorthand (function) form is treated as `{ handler, query: undefined, context: undefined }`.
 * 比较两个事件配置值是否相等。直接读取字段，避免分配标准化对象；
 * 函数简写形式视作 `{ handler, query: undefined, context: undefined }`。
 */
function eventConfigEqual(a: EChartsEventConfig, b: EChartsEventConfig): boolean {
  if (a === b) return true;
  if (typeof a === "function") {
    if (typeof b === "function") return false;
    return a === b.handler && b.query === undefined && b.context === undefined;
  }
  if (typeof b === "function") {
    return a.handler === b && a.query === undefined && a.context === undefined;
  }
  return a.handler === b.handler && a.query === b.query && a.context === b.context;
}

/**
 * Shallow comparison of two EChartsEvents maps.
 * Empty maps and undefined are treated as equivalent (no listeners).
 * 两个事件映射的浅比较；空对象与 undefined 视为等价（均表示无监听）。
 */
export function eventsEqual(a: EChartsEvents | undefined, b: EChartsEvents | undefined): boolean {
  if (a === b) return true;
  const keysA = a ? Object.keys(a) : [];
  const keysB = b ? Object.keys(b) : [];
  if (keysA.length !== keysB.length) return false;
  if (keysA.length === 0) return true;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b!, key)) return false;
    if (!eventConfigEqual(a![key], b![key])) return false;
  }
  return true;
}

/**
 * Unbind events from ECharts instance
 * 从 ECharts 实例解绑事件
 *
 * Relies on ECharts `off(name, handler)` matching listeners by handler
 * reference (independent of `query`). Multiple bindings of the same handler
 * with different queries are removed together.
 */
export function unbindEvents(instance: ECharts, events: EChartsEvents | undefined): void {
  if (!events) return;
  for (const [eventName, config] of Object.entries(events)) {
    const { handler } = normalizeEventConfig(config);
    instance.off(eventName, handler);
  }
}
