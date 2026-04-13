import type { ECharts } from "echarts";
import type { EChartsEvents, EChartsEventConfig } from "../../types";

/**
 * Normalize event config to full object form
 * 将事件配置标准化为完整对象形式
 */
function normalizeEventConfig(config: EChartsEventConfig): {
  handler: (params: unknown) => void;
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
    if (query) {
      instance.on(eventName, query, handler, context);
    } else {
      instance.on(eventName, handler, context);
    }
  }
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
