import { describe, it, expect, vi } from "vite-plus/test";
import { eventsEqual } from "../../hooks/internal/event-utils";
import type { EChartsEventConfig } from "../../types";

const fn = () => vi.fn() as unknown as EChartsEventConfig;

describe("eventsEqual", () => {
  it("should return true for same reference", () => {
    const events = { click: fn() };
    expect(eventsEqual(events, events)).toBe(true);
  });

  it("should return true for both undefined", () => {
    expect(eventsEqual(undefined, undefined)).toBe(true);
  });

  it("should return false when one is undefined", () => {
    expect(eventsEqual({ click: fn() }, undefined)).toBe(false);
    expect(eventsEqual(undefined, { click: fn() })).toBe(false);
  });

  it("should return true for same function handlers", () => {
    const handler = fn();
    expect(eventsEqual({ click: handler }, { click: handler })).toBe(true);
  });

  it("should return false for different function handlers", () => {
    expect(eventsEqual({ click: fn() }, { click: fn() })).toBe(false);
  });

  it("should return true for same object configs with same references", () => {
    const handler = vi.fn();
    const context = { name: "test" };
    expect(
      eventsEqual(
        { click: { handler, query: "series", context } },
        { click: { handler, query: "series", context } },
      ),
    ).toBe(true);
  });

  it("should return false for different object config handlers", () => {
    expect(eventsEqual({ click: { handler: vi.fn() } }, { click: { handler: vi.fn() } })).toBe(
      false,
    );
  });

  it("should return false for different key counts", () => {
    const handler = fn();
    expect(eventsEqual({ click: handler }, { click: handler, mouseover: handler })).toBe(false);
  });

  it("should return false for different keys", () => {
    const handler = fn();
    expect(eventsEqual({ click: handler }, { mouseover: handler })).toBe(false);
  });

  it("should treat shorthand and full config with same handler as equal", () => {
    const handler = vi.fn<(params: unknown) => void>();
    expect(eventsEqual({ click: handler }, { click: { handler } })).toBe(true);
  });

  it("should return false when query differs", () => {
    const handler = vi.fn();
    expect(
      eventsEqual(
        { click: { handler, query: "series" } },
        { click: { handler, query: "dataZoom" } },
      ),
    ).toBe(false);
  });

  it("should return false when context differs", () => {
    const handler = vi.fn();
    expect(
      eventsEqual(
        { click: { handler, context: { a: 1 } } },
        { click: { handler, context: { b: 2 } } },
      ),
    ).toBe(false);
  });
});
