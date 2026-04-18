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
 * Compares keys, then each event config at the handler/query/context level.
 * 两个事件映射的浅比较。比较键，然后在 handler/query/context 级别比较每个事件配置。
 */
export function eventsEqual(a: EChartsEvents | undefined, b: EChartsEvents | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!eventConfigEqual(a[key], b[key])) return false;
  }
  return true;
}

/**
 * Unbind events from ECharts instance
 * 从 ECharts 实例解绑事件
 */
export function unbindEvents(instance: ECharts, events: EChartsEvents | undefined): void {
  if (!events) return;
  for (const [eventName, config] of Object.entries(events)) {
    const { handler } = normalizeEventConfig(config);
    instance.off(eventName, handler);
  }
}
