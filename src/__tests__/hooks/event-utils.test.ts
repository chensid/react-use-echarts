import { describe, it, expect, vi } from "vite-plus/test";
import type { ECharts } from "echarts";
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
});
