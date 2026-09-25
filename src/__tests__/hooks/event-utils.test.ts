import { describe, it, expect, vi } from "vite-plus/test";
import type { ECharts } from "echarts/core";
import {
  bindEvents,
  bindingsMatch,
  unbindEvents,
  type BoundEvents,
} from "../../hooks/internal/event-utils";
import type { EChartsEvents } from "../../types";

const handler = () => vi.fn<(params: unknown) => void>();
const createEventInstance = () => {
  const on = vi.fn();
  const off = vi.fn();
  return { instance: { on, off } as unknown as ECharts, on, off };
};
const latestOf = (onEvents: EChartsEvents | undefined) => ({ current: { onEvents } });

function bind(events: EChartsEvents | undefined, latest = latestOf(events)) {
  const { instance, on, off } = createEventInstance();
  const bound: BoundEvents = new Map();
  bindEvents(instance, events, latest, bound);
  return { instance, on, off, bound, latest };
}

/** The proxy registered for the n-th on() call (last argument before context). */
function proxyOf(on: ReturnType<typeof vi.fn>, call = 0): (params: unknown) => void {
  const args = on.mock.calls[call]!;
  return args[args.length - 2] as (params: unknown) => void;
}

describe("bindEvents", () => {
  it("should skip when events is undefined", () => {
    const { on, bound } = bind(undefined);
    expect(on).not.toHaveBeenCalled();
    expect(bound.size).toBe(0);
  });

  it("should bind a proxy (not the handler) without query", () => {
    const click = handler();
    const { on, bound } = bind({ click });

    expect(on).toHaveBeenCalledWith("click", expect.any(Function), undefined);
    const proxy = proxyOf(on);
    expect(proxy).not.toBe(click);
    expect(bound.get("click")).toEqual({ proxy, query: undefined, context: undefined });
  });

  it("should pass string and object queries and context through", () => {
    const context = { name: "ctx" };
    const query = { seriesIndex: 0 };
    const { on } = bind({
      click: { handler: handler(), query: "series", context },
      mouseover: { handler: handler(), query },
      dblclick: { handler: handler(), query: "" },
    });

    expect(on).toHaveBeenCalledWith("click", "series", expect.any(Function), context);
    expect(on).toHaveBeenCalledWith("mouseover", query, expect.any(Function), undefined);
    expect(on).toHaveBeenCalledWith("dblclick", "", expect.any(Function), undefined);
  });

  it("should call the latest handler with the proxy's `this` and params", () => {
    const first = handler();
    const second = handler();
    const latest = latestOf({ click: first });
    const { on } = bind({ click: first }, latest);
    const proxy = proxyOf(on);
    const context = { name: "ctx" };

    proxy.call(context, { dataIndex: 1 });
    expect(first).toHaveBeenCalledWith({ dataIndex: 1 });
    expect(first.mock.contexts[0]).toBe(context);

    latest.current.onEvents = { click: { handler: second } };
    proxy.call(undefined, { dataIndex: 2 });
    expect(second).toHaveBeenCalledWith({ dataIndex: 2 });
    expect(first).toHaveBeenCalledTimes(1);
  });

  it("should do nothing when the latest events no longer have a listener", () => {
    const click = handler();
    const latest = latestOf({ click });
    const { on } = bind({ click }, latest);

    latest.current.onEvents = { click: undefined };
    expect(() => proxyOf(on)(1)).not.toThrow();
    latest.current.onEvents = undefined;
    expect(() => proxyOf(on)(2)).not.toThrow();
    expect(click).not.toHaveBeenCalled();
  });

  it("skips entries whose value is undefined or null", () => {
    const events = {
      click: handler(),
      dblclick: undefined,
      mouseover: null,
    } as unknown as EChartsEvents;
    const { on, bound } = bind(events);

    expect(on).toHaveBeenCalledTimes(1);
    expect([...bound.keys()]).toEqual(["click"]);
  });

  it("should record a binding before on() so a throwing on() can still be unbound", () => {
    const { instance, on } = createEventInstance();
    const failure = new Error("on failed");
    on.mockImplementation(() => {
      throw failure;
    });
    const bound: BoundEvents = new Map();

    expect(() => bindEvents(instance, { click: handler() }, latestOf(undefined), bound)).toThrow(
      failure,
    );
    expect(bound.has("click")).toBe(true);
  });
});

describe("bindingsMatch", () => {
  const boundFor = (events: EChartsEvents | undefined) => bind(events).bound;

  it("should treat undefined, empty maps and empty objects as nothing bound", () => {
    expect(bindingsMatch(undefined, undefined)).toBe(true);
    expect(bindingsMatch(new Map(), undefined)).toBe(true);
    expect(bindingsMatch(undefined, {})).toBe(true);
    expect(bindingsMatch(new Map(), { click: undefined })).toBe(true);
  });

  it("should ignore handler identity", () => {
    const bound = boundFor({ click: handler() });
    expect(bindingsMatch(bound, { click: handler() })).toBe(true);
    expect(bindingsMatch(bound, { click: { handler: handler() } })).toBe(true);
  });

  it("should detect added and removed event names", () => {
    const bound = boundFor({ click: handler() });
    expect(bindingsMatch(bound, undefined)).toBe(false);
    expect(bindingsMatch(bound, { click: handler(), dblclick: handler() })).toBe(false);
    expect(bindingsMatch(bound, { dblclick: handler() })).toBe(false);
    expect(bindingsMatch(undefined, { click: handler() })).toBe(false);
  });

  it("should compare queries shallowly", () => {
    const bound = boundFor({ click: { handler: handler(), query: { seriesIndex: 0 } } });
    expect(bindingsMatch(bound, { click: { handler: handler(), query: { seriesIndex: 0 } } })).toBe(
      true,
    );
    expect(bindingsMatch(bound, { click: { handler: handler(), query: { seriesIndex: 1 } } })).toBe(
      false,
    );
    expect(bindingsMatch(bound, { click: handler() })).toBe(false);

    const stringBound = boundFor({ click: { handler: handler(), query: "series" } });
    expect(bindingsMatch(stringBound, { click: { handler: handler(), query: "series" } })).toBe(
      true,
    );
    expect(bindingsMatch(stringBound, { click: { handler: handler(), query: "xAxis" } })).toBe(
      false,
    );
  });

  it("should compare context by reference", () => {
    const context = { name: "ctx" };
    const bound = boundFor({ click: { handler: handler(), context } });
    expect(bindingsMatch(bound, { click: { handler: handler(), context } })).toBe(true);
    expect(bindingsMatch(bound, { click: { handler: handler(), context: { name: "ctx" } } })).toBe(
      false,
    );
    expect(bindingsMatch(bound, { click: handler() })).toBe(false);
  });
});

describe("unbindEvents", () => {
  it("should skip when nothing is bound", () => {
    const { instance, off } = createEventInstance();
    unbindEvents(instance, undefined);
    expect(off).not.toHaveBeenCalled();
  });

  it("should unbind each recorded proxy by event name", () => {
    const { instance, on, off, bound } = bind({ click: handler(), dblclick: handler() });

    unbindEvents(instance, bound);

    expect(off).toHaveBeenCalledTimes(2);
    expect(off).toHaveBeenCalledWith("click", proxyOf(on, 0));
    expect(off).toHaveBeenCalledWith("dblclick", proxyOf(on, 1));
  });
});
