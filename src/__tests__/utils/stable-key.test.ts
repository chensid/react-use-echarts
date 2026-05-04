import { describe, it, expect } from "vite-plus/test";
import { computeStableKey, isCircularFallbackKey } from "../../utils/stable-key";

describe("computeStableKey", () => {
  it("returns null for nullish values", () => {
    expect(computeStableKey(null)).toBeNull();
    expect(computeStableKey(undefined)).toBeNull();
  });

  it("returns strings unchanged", () => {
    expect(computeStableKey("light")).toBe("light");
    expect(computeStableKey("")).toBe("");
  });

  it("stringifies numbers", () => {
    expect(computeStableKey(0)).toBe("0");
    expect(computeStableKey(0.5)).toBe("0.5");
  });

  it("returns null for unsupported primitives", () => {
    expect(computeStableKey(true)).toBeNull();
    expect(computeStableKey(Symbol("x"))).toBeNull();
  });

  it("JSON-serializes plain objects and arrays", () => {
    expect(computeStableKey({ a: 1, b: 2 })).toBe('{"a":1,"b":2}');
    expect(computeStableKey([0, 0.5, 1])).toBe("[0,0.5,1]");
  });

  it("falls back to a stable id for circular objects", () => {
    const a: { self?: unknown } = {};
    a.self = a;

    const key1 = computeStableKey(a);
    const key2 = computeStableKey(a);

    expect(key1).not.toBeNull();
    expect(key1).toBe(key2);
    expect(isCircularFallbackKey(key1!)).toBe(true);
  });

  it("returns distinct fallback ids for distinct circular objects", () => {
    const a: { self?: unknown } = {};
    a.self = a;
    const b: { self?: unknown } = {};
    b.self = b;

    expect(computeStableKey(a)).not.toBe(computeStableKey(b));
  });
});

describe("isCircularFallbackKey", () => {
  it("identifies fallback ids", () => {
    const a: { self?: unknown } = {};
    a.self = a;
    expect(isCircularFallbackKey(computeStableKey(a)!)).toBe(true);
  });

  it("rejects regular keys", () => {
    expect(isCircularFallbackKey("light")).toBe(false);
    expect(isCircularFallbackKey('{"a":1}')).toBe(false);
  });
});
