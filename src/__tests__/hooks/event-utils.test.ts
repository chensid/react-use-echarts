import { describe, it, expect, vi } from "vite-plus/test";
import type { ECharts } from "echarts/core";
import { bindEvents, unbindEvents, eventsEqual } from "../../hooks/internal/event-utils";

const handler = () => vi.fn<(params: unknown) => void>();
const createEventInstance = () =>
  ({
    on: vi.fn(),
    off: vi.fn(),
  }) as unknown as ECharts;

describe("eventsEqual", () => {
  it("should return true for same reference", () => {
    const events = { click: handler() };
    expect(eventsEqual(events, events)).toBe(true);
  });

  it("should return true for both undefined", () => {
    expect(eventsEqual(undefined, undefined)).toBe(true);
  });

  it("should return false when one is undefined", () => {
    expect(eventsEqual({ click: handler() }, undefined)).toBe(false);
    expect(eventsEqual(undefined, { click: handler() })).toBe(false);
  });

  it("should treat empty object and undefined as equivalent", () => {
    expect(eventsEqual({}, undefined)).toBe(true);
    expect(eventsEqual(undefined, {})).toBe(true);
  });

  it("should return true for two empty objects", () => {
    expect(eventsEqual({}, {})).toBe(true);
  });

  it("should return true for same function handlers", () => {
    const h = handler();
    expect(eventsEqual({ click: h }, { click: h })).toBe(true);
  });

  it("should return false for different function handlers", () => {
    expect(eventsEqual({ click: handler() }, { click: handler() })).toBe(false);
  });

  it("should return true for same object configs with same references", () => {
    const h = handler();
    const context = { name: "test" };
    expect(
      eventsEqual(
        { click: { handler: h, query: "series", context } },
        { click: { handler: h, query: "series", context } },
      ),
    ).toBe(true);
  });

  it("should return false for different object config handlers", () => {
    expect(eventsEqual({ click: { handler: handler() } }, { click: { handler: handler() } })).toBe(
      false,
    );
  });

  it("should return false for different key counts", () => {
    const h = handler();
    expect(eventsEqual({ click: h }, { click: h, mouseover: h })).toBe(false);
  });

  it("should return false for different keys", () => {
    const h = handler();
    expect(eventsEqual({ click: h }, { mouseover: h })).toBe(false);
  });

  it("should treat shorthand and full config with same handler as equal", () => {
    const h = handler();
    expect(eventsEqual({ click: h }, { click: { handler: h } })).toBe(true);
  });

  it("should treat full config and shorthand as equal only when query/context are absent", () => {
    const h = handler();
    const context = { name: "test" };

    expect(eventsEqual({ click: { handler: h } }, { click: h })).toBe(true);
    expect(eventsEqual({ click: { handler: handler() } }, { click: h })).toBe(false);
    expect(eventsEqual({ click: { handler: h, query: "series" } }, { click: h })).toBe(false);
    expect(eventsEqual({ click: { handler: h, context } }, { click: h })).toBe(false);
    expect(eventsEqual({ click: handler() }, { click: handler() })).toBe(false);
  });

  it("should return false when query differs", () => {
    const h = handler();
    expect(
      eventsEqual(
        { click: { handler: h, query: "series" } },
        { click: { handler: h, query: "dataZoom" } },
      ),
    ).toBe(false);
  });

  it("should return false when context differs", () => {
    const h = handler();
    expect(
      eventsEqual(
        { click: { handler: h, context: { a: 1 } } },
        { click: { handler: h, context: { b: 2 } } },
      ),
    ).toBe(false);
  });

  // Regression: the EChartsEvents index signature is
  // `EChartsEventConfig<any> | undefined`, so user code like
  //   onEvents={{ click: handler, hover: enabled ? hoverFn : undefined }}
  // can land an explicit `undefined` under a key. Before the guard in
  // eventConfigEqual, comparing { hover: hoverFn } to { hover: undefined }
  // dereferenced `b.handler` on undefined and crashed.
  it("does not throw and returns false when one side has an explicit undefined entry", () => {
    const h = handler();
    expect(() => eventsEqual({ hover: h }, { hover: undefined })).not.toThrow();
    expect(eventsEqual({ hover: h }, { hover: undefined })).toBe(false);
    expect(eventsEqual({ hover: undefined }, { hover: h })).toBe(false);
    expect(eventsEqual({ hover: undefined }, { hover: undefined })).toBe(true);
  });

  it("does not throw when an object-config side faces an undefined entry", () => {
    const h = handler();
    expect(() =>
      eventsEqual({ click: { handler: h, query: "series" } }, { click: undefined }),
    ).not.toThrow();
    expect(eventsEqual({ click: { handler: h, query: "series" } }, { click: undefined })).toBe(
      false,
    );
  });

  // An explicit-undefined value means "no listener" (bindEvents/unbindEvents
  // both skip it), so it must be equivalent to the key being absent. Comparing
  // raw key counts would treat these as different and force a redundant
  // unbind/rebind on every render for code like
  //   onEvents={{ click: h, hover: enabled ? hoverFn : undefined }}
  it("treats an explicit-undefined entry as equivalent to an absent key", () => {
    const h = handler();
    expect(eventsEqual({ click: h }, { click: h, hover: undefined })).toBe(true);
    expect(eventsEqual({ click: h, hover: undefined }, { click: h })).toBe(true);
    // Differing undefined-only keys are still equivalent (both effectively {click:h}).
    expect(eventsEqual({ click: h, a: undefined }, { click: h, b: undefined })).toBe(true);
    // A defined extra listener is a real difference and must NOT compare equal.
    expect(eventsEqual({ click: h }, { click: h, hover: h })).toBe(false);
  });

  // JS callers can land an out-of-type `null` under a key (the index signature
  // is `EChartsEventConfig | undefined`). null must behave exactly like
  // undefined / an absent key ("no listener"); before the nullish guard in
  // eventConfigEqual, comparing it against a defined config dereferenced
  // `null.handler` and crashed.
  it("treats an explicit-null entry like undefined (no listener)", () => {
    const h = handler();
    const withNull = { click: h, hover: null } as unknown as Parameters<typeof eventsEqual>[0];
    expect(() => eventsEqual(withNull, { click: h })).not.toThrow();
    expect(eventsEqual(withNull, { click: h })).toBe(true);
    expect(eventsEqual(withNull, { click: h, hover: undefined })).toBe(true);
    // null vs a defined listener is a real difference.
    expect(eventsEqual(withNull, { click: h, hover: h })).toBe(false);
  });
});

describe("bindEvents", () => {
  it("should skip when events is undefined", () => {
    const instance = createEventInstance();

    bindEvents(instance, undefined);

    expect(instance.on).not.toHaveBeenCalled();
  });

  it("should bind event without query using context signature", () => {
    const on = vi.fn();
    const instance = { on, off: vi.fn() } as unknown as ECharts;
    const clickHandler = handler();
    const context = { source: "test" };

    bindEvents(instance, {
      click: {
        handler: clickHandler,
        context,
      },
    });

    expect(on).toHaveBeenCalledWith("click", clickHandler, context);
  });

  it("should bind event with string query", () => {
    const on = vi.fn();
    const instance = { on, off: vi.fn() } as unknown as ECharts;
    const clickHandler = handler();

    bindEvents(instance, {
      click: {
        handler: clickHandler,
        query: "series",
      },
    });

    expect(on).toHaveBeenCalledWith("click", "series", clickHandler, undefined);
  });

  it("should bind event with object query", () => {
    const on = vi.fn();
    const instance = { on, off: vi.fn() } as unknown as ECharts;
    const clickHandler = handler();
    const query = { seriesIndex: 0 };

    bindEvents(instance, {
      click: {
        handler: clickHandler,
        query,
      },
    });

    expect(on).toHaveBeenCalledWith("click", query, clickHandler, undefined);
  });

  // Parity with the eventsEqual undefined-entry guard: `EChartsEvents`'s index
  // signature is `EChartsEventConfig | undefined`, so user code can assign an
  // explicit-undefined value under a key. Bind must skip it instead of calling
  // `instance.on(name, undefined)` (which would throw).
  it("skips entries whose value is undefined", () => {
    const on = vi.fn();
    const instance = { on, off: vi.fn() } as unknown as ECharts;
    const clickHandler = handler();

    bindEvents(instance, { click: clickHandler, hover: undefined });

    expect(on).toHaveBeenCalledTimes(1);
    expect(on).toHaveBeenCalledWith("click", clickHandler, undefined);
  });

  // Parity with the eventsEqual nullish guard: a JS caller can land an
  // out-of-type `null` under a key. Bind must skip it instead of destructuring
  // null (which throws), exactly as it skips undefined.
  it("skips entries whose value is null", () => {
    const on = vi.fn();
    const instance = { on, off: vi.fn() } as unknown as ECharts;
    const clickHandler = handler();

    bindEvents(instance, {
      click: clickHandler,
      hover: null,
    } as unknown as Parameters<typeof bindEvents>[1]);

    expect(on).toHaveBeenCalledTimes(1);
    expect(on).toHaveBeenCalledWith("click", clickHandler, undefined);
  });
});

describe("unbindEvents", () => {
  it("should skip when events is undefined", () => {
    const instance = createEventInstance();

    unbindEvents(instance, undefined);

    expect(instance.off).not.toHaveBeenCalled();
  });

  it("should unbind handlers using event name and handler", () => {
    const off = vi.fn();
    const instance = { on: vi.fn(), off } as unknown as ECharts;
    const clickHandler = handler();
    const mouseoverHandler = handler();

    unbindEvents(instance, {
      click: { handler: clickHandler, query: "series" },
      mouseover: mouseoverHandler,
    });

    expect(off).toHaveBeenNthCalledWith(1, "click", clickHandler);
    expect(off).toHaveBeenNthCalledWith(2, "mouseover", mouseoverHandler);
  });

  // Mirror of the bindEvents guard above — explicit-undefined values must be
  // skipped instead of calling `instance.off(name, undefined)`.
  it("skips entries whose value is undefined", () => {
    const off = vi.fn();
    const instance = { on: vi.fn(), off } as unknown as ECharts;
    const clickHandler = handler();

    unbindEvents(instance, { click: clickHandler, hover: undefined });

    expect(off).toHaveBeenCalledTimes(1);
    expect(off).toHaveBeenCalledWith("click", clickHandler);
  });

  // Mirror of the bindEvents guard — explicit-null values must be skipped
  // instead of reading `.handler` off null.
  it("skips entries whose value is null", () => {
    const off = vi.fn();
    const instance = { on: vi.fn(), off } as unknown as ECharts;
    const clickHandler = handler();

    unbindEvents(instance, {
      click: clickHandler,
      hover: null,
    } as unknown as Parameters<typeof unbindEvents>[1]);

    expect(off).toHaveBeenCalledTimes(1);
    expect(off).toHaveBeenCalledWith("click", clickHandler);
  });
});
