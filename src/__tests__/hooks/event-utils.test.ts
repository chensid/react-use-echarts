import { describe, it, expect, vi } from "vite-plus/test";
import { eventsEqual } from "../../hooks/internal/event-utils";

const handler = () => vi.fn<(params: unknown) => void>();

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
