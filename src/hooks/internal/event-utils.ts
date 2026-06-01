import type { ECharts } from "echarts/core";
import type { EChartsEvents, EChartsEventConfig } from "../../types";

/**
 * Bind events to ECharts instance
 * 绑定事件到 ECharts 实例
 */
export function bindEvents(instance: ECharts, events: EChartsEvents | undefined): void {
  if (!events) return;
  for (const [eventName, config] of Object.entries(events)) {
    // null/undefined both mean "no listener". undefined is the in-type sentinel
    // (`EChartsEventConfig | undefined`); a JS caller can also land an out-of-type
    // null. Skip both — destructuring null below would throw.
    if (config == null) continue;
    if (typeof config === "function") {
      instance.on(eventName, config, undefined);
      continue;
    }
    const { handler, query, context } = config;
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
 * `null`/`undefined` are allowed on either side and treated as "no listener" —
 * a nullish value is only equal to another nullish value.
 * 比较两个事件配置值是否相等。直接读取字段，避免分配标准化对象；
 * 函数简写形式视作 `{ handler, query: undefined, context: undefined }`。
 * 任意一侧为 null/undefined（均表示无监听）时，仅当另一侧也为 null/undefined 才相等。
 */
function eventConfigEqual(
  a: EChartsEventConfig | undefined,
  b: EChartsEventConfig | undefined,
): boolean {
  if (a === b) return true;
  // Treat null/undefined uniformly as "no listener" (bindEvents/unbindEvents
  // skip both): two nullish values are equal, a nullish vs a defined config is
  // not. This also guards the property reads below (`a.handler`, `b.handler`)
  // from a nullish deref — undefined is the in-type sentinel, and JS callers can
  // additionally land an out-of-type `null` under an EChartsEvents key.
  if (a == null || b == null) return a == null && b == null;
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
  // Compare effective (non-undefined) listeners, not raw key counts. A key
  // whose value is `undefined` means "no listener" (bindEvents/unbindEvents
  // both skip it), so `{ click: h }` and `{ click: h, hover: undefined }` must
  // be equivalent — comparing key counts would treat them as different and
  // trigger a redundant unbind/rebind. eventConfigEqual already treats
  // undefined on either side as equal to undefined and unequal to any defined
  // config (an absent key reads back as undefined, matching an explicit one).
  //
  // Two-pass key walk (mirrors shallowEqual) — avoids allocating a key-union
  // Set on a path that runs every render when `onEvents` is an inline object
  // literal (the Event Rebinding effect calls this as its dedup fast path).
  // Pass 1: every key in `a` must match `b` (covers keys present in both).
  if (a) {
    for (const key of Object.keys(a)) {
      if (!eventConfigEqual(a[key], b?.[key])) return false;
    }
  }
  // Pass 2: keys present only in `b` (the `a` side reads back as undefined).
  // Keys in both were already compared in pass 1, so skip them.
  if (b) {
    for (const key of Object.keys(b)) {
      if (a && Object.prototype.hasOwnProperty.call(a, key)) continue;
      if (!eventConfigEqual(undefined, b[key])) return false;
    }
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
    // Mirror bindEvents: skip null/undefined ("no listener"); `config.handler`
    // on a nullish value would throw.
    if (config == null) continue;
    const handler = typeof config === "function" ? config : config.handler;
    instance.off(eventName, handler);
  }
}
