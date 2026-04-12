import { useEffect } from "react";
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

/**
 * Internal hook: Rebind event handlers when onEvents changes.
 * 内部 hook：当 onEvents 变化时重新绑定事件处理器。
 */
export function useEvents(
  getInstance: () => ECharts | undefined,
  onEvents: EChartsEvents | undefined,
  boundEventsRef: React.MutableRefObject<EChartsEvents | undefined>,
): void {
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    // Same reference — already bound
    if (boundEventsRef.current === onEvents) return;

    unbindEvents(instance, boundEventsRef.current);
    bindEvents(instance, onEvents);
    boundEventsRef.current = onEvents;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boundEventsRef is a stable container
  }, [getInstance, onEvents]);
}
