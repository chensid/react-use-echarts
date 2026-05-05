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
 * Normalizes both to full form, then compares handler/query/context by reference.
 * 比较两个事件配置值是否相等。标准化后按引用比较 handler/query/context。
 */
function eventConfigEqual(a: EChartsEventConfig, b: EChartsEventConfig): boolean {
  if (a === b) return true;
  const na = normalizeEventConfig(a);
  const nb = normalizeEventConfig(b);
  return na.handler === nb.handler && na.query === nb.query && na.context === nb.context;
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
