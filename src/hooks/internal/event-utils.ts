import type { ECharts } from "echarts/core";
import type { EChartsEventConfig, EChartsEvents } from "../../types";
import { shallowEqual } from "../../utils/shallow-equal";

/**
 * One event name bound on an instance: the stable proxy registered with
 * ECharts plus the `query` / `context` it was registered with.
 * 已绑定的单个事件：注册到 ECharts 的稳定代理函数及其 query / context。
 */
export interface BoundEvent {
  readonly proxy: (this: unknown, params: unknown) => void;
  readonly query: string | object | undefined;
  readonly context: object | undefined;
}

/** Bindings keyed by event name. 按事件名索引的绑定记录。 */
export type BoundEvents = Map<string, BoundEvent>;

/** Where proxies read the latest `onEvents` at call time. 代理在调用时读取最新 onEvents 的来源。 */
export interface LatestEventsSource {
  readonly current: { readonly onEvents: EChartsEvents | undefined };
}

function readHandler(config: EChartsEventConfig | undefined): ((params: unknown) => void) | null {
  if (config == null) return null;
  return typeof config === "function" ? config : config.handler;
}

/**
 * Bind one proxy per event name. The proxy looks up the handler in
 * `latest.current.onEvents` when ECharts fires, so a new handler reference
 * (e.g. an inline arrow function) takes effect without unbinding/rebinding.
 * Bindings are recorded into `bound` before each `on()` call, so a caller
 * holding `bound` can still unbind everything attempted if `on()` throws.
 * 每个事件名绑定一个代理，触发时从 `latest.current.onEvents` 读取最新 handler，
 * 因此 handler 引用变化（如内联箭头函数）无需解绑重绑。
 */
export function bindEvents(
  instance: ECharts,
  events: EChartsEvents | undefined,
  latest: LatestEventsSource,
  bound: BoundEvents,
): void {
  if (!events) return;
  for (const [eventName, config] of Object.entries(events)) {
    // null/undefined both mean "no listener"; JS callers can pass null.
    if (config == null) continue;
    const query = typeof config === "function" ? undefined : config.query;
    const context = typeof config === "function" ? undefined : config.context;
    const proxy = function (this: unknown, params: unknown): void {
      readHandler(latest.current.onEvents?.[eventName])?.call(this, params);
    };
    bound.set(eventName, { proxy, query, context });
    if (query !== undefined) {
      instance.on(eventName, query, proxy, context);
    } else {
      instance.on(eventName, proxy, context);
    }
  }
}

/**
 * Whether `events` would produce the same bindings as `bound`: the same event
 * names with listeners, and per name a shallow-equal `query` and the same
 * `context`. Handler identity is irrelevant — proxies read it at call time.
 * `undefined` and an empty map are both "nothing bound".
 * 判断 `events` 与已有绑定是否结构一致：事件名集合相同，且每个事件的 query 浅相等、
 * context 引用相同。handler 引用不参与比较（代理在调用时读取）。
 */
export function bindingsMatch(bound: BoundEvents | undefined, events: EChartsEvents | undefined) {
  let count = 0;
  if (events) {
    for (const [eventName, config] of Object.entries(events)) {
      if (config == null) continue;
      const binding = bound?.get(eventName);
      if (!binding) return false;
      const query = typeof config === "function" ? undefined : config.query;
      const context = typeof config === "function" ? undefined : config.context;
      if (binding.context !== context || !shallowEqual(binding.query, query)) return false;
      count++;
    }
  }
  return count === (bound?.size ?? 0);
}

/**
 * Unbind every recorded proxy. `off(name, proxy)` only matches our own proxy,
 * so other listeners on a shared instance are untouched.
 * 解绑所有已记录的代理；`off(name, proxy)` 只匹配本 hook 的代理。
 */
export function unbindEvents(instance: ECharts, bound: BoundEvents | undefined): void {
  if (!bound) return;
  for (const [eventName, { proxy }] of bound) {
    instance.off(eventName, proxy);
  }
}
