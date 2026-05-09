import { describe, it, expect } from "vite-plus/test";
import { computeStableKey } from "../../utils/stable-key";

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

  it("returns null when JSON.stringify throws (circular refs, BigInt)", () => {
    const a: { self?: unknown } = {};
    a.self = a;
    expect(computeStableKey(a)).toBeNull();
    expect(computeStableKey({ big: 1n })).toBeNull();
  });
});
