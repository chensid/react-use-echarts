import { describe, it, expect } from "vite-plus/test";
import { shallowEqual } from "../../utils/shallow-equal";

describe("shallowEqual", () => {
  it("should return true for same reference", () => {
    const obj = { a: 1 };
    expect(shallowEqual(obj, obj)).toBe(true);
  });

  it("should return true for both null", () => {
    expect(shallowEqual(null, null)).toBe(true);
  });

  it("should return true for both undefined", () => {
    expect(shallowEqual(undefined, undefined)).toBe(true);
  });

  it("should return false for null vs undefined", () => {
    expect(shallowEqual(null, undefined)).toBe(false);
  });

  it("should return false for null vs object", () => {
    expect(shallowEqual(null, { a: 1 })).toBe(false);
    expect(shallowEqual({ a: 1 }, null)).toBe(false);
  });

  it("should return true for objects with same keys and values", () => {
    const series = [{ type: "line", data: [1, 2, 3] }];
    expect(shallowEqual({ series }, { series })).toBe(true);
  });

  it("should return false for objects with different values", () => {
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("should return false for objects with different key counts", () => {
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("should return false for objects with different keys", () => {
    expect(shallowEqual({ a: 1 }, { b: 1 })).toBe(false);
  });

  it("should use Object.is semantics for values", () => {
    expect(shallowEqual({ a: NaN }, { a: NaN })).toBe(true);
    expect(shallowEqual({ a: 0 }, { a: -0 })).toBe(false);
  });

  it("should return true for equal primitives", () => {
    expect(shallowEqual(1, 1)).toBe(true);
    expect(shallowEqual("hello", "hello")).toBe(true);
    expect(shallowEqual(true, true)).toBe(true);
  });

  it("should return false for different primitives", () => {
    expect(shallowEqual(1, 2)).toBe(false);
    expect(shallowEqual("a", "b")).toBe(false);
  });

  it("should compare arrays shallowly by index", () => {
    expect(shallowEqual([1, 2], [1, 2])).toBe(true);
    expect(shallowEqual([1, 2], [1, 3])).toBe(false);
    expect(shallowEqual([1], [1, 2])).toBe(false);
  });

  it("should return false for different types", () => {
    expect(shallowEqual(1, "1")).toBe(false);
  });
});
