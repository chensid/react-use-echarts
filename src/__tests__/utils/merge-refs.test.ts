import { describe, it, expect, vi } from "vite-plus/test";
import type { MutableRefObject, RefCallback } from "react";
import { mergeRefs } from "../../utils/merge-refs";

describe("mergeRefs", () => {
  it("writes node to a RefObject's current and clears on cleanup", () => {
    const ref: MutableRefObject<HTMLDivElement | null> = { current: null };
    const node = document.createElement("div");

    const merged = mergeRefs(ref);
    const cleanup = merged(node);

    expect(ref.current).toBe(node);

    cleanup?.();
    expect(ref.current).toBeNull();
  });

  it("invokes a legacy callback ref with node and again with null on cleanup", () => {
    const cb = vi.fn();
    const node = document.createElement("div");

    const merged = mergeRefs(cb as RefCallback<HTMLDivElement>);
    const cleanup = merged(node);

    expect(cb).toHaveBeenCalledExactlyOnceWith(node);

    cleanup?.();
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenLastCalledWith(null);
  });

  it("chains a React 19 callback ref's returned cleanup", () => {
    const innerCleanup = vi.fn();
    const cb = vi.fn(() => innerCleanup);
    const node = document.createElement("div");

    const merged = mergeRefs(cb as RefCallback<HTMLDivElement>);
    const cleanup = merged(node);

    expect(cb).toHaveBeenCalledExactlyOnceWith(node);
    expect(innerCleanup).not.toHaveBeenCalled();

    cleanup?.();
    expect(innerCleanup).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledOnce(); // not re-invoked with null
  });

  it("merges multiple refs of mixed shapes", () => {
    const objRef: MutableRefObject<HTMLDivElement | null> = { current: null };
    const legacyCb = vi.fn();
    const cleanup19 = vi.fn();
    const cb19 = vi.fn(() => cleanup19);
    const node = document.createElement("div");

    const merged = mergeRefs(
      objRef,
      legacyCb as RefCallback<HTMLDivElement>,
      cb19 as RefCallback<HTMLDivElement>,
    );
    const cleanup = merged(node);

    expect(objRef.current).toBe(node);
    expect(legacyCb).toHaveBeenCalledWith(node);
    expect(cb19).toHaveBeenCalledWith(node);

    cleanup?.();
    expect(objRef.current).toBeNull();
    expect(legacyCb).toHaveBeenLastCalledWith(null);
    expect(cleanup19).toHaveBeenCalledOnce();
  });

  it("skips null and undefined entries", () => {
    const ref: MutableRefObject<HTMLDivElement | null> = { current: null };
    const node = document.createElement("div");

    const merged = mergeRefs(null, undefined, ref, null);
    const cleanup = merged(node);

    expect(ref.current).toBe(node);

    cleanup?.();
    expect(ref.current).toBeNull();
  });

  it("returns a stable function shape even when no refs are passed", () => {
    const merged = mergeRefs();
    expect(typeof merged).toBe("function");
    const cleanup = merged(document.createElement("div"));
    expect(typeof cleanup).toBe("function");
    expect(() => cleanup?.()).not.toThrow();
  });

  it("isolates a throwing ref callback so later refs still receive the node", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const angry: RefCallback<HTMLDivElement> = () => {
        throw new Error("angry ref");
      };
      const objRef: MutableRefObject<HTMLDivElement | null> = { current: null };
      const calmCb = vi.fn();
      const node = document.createElement("div");

      const merged = mergeRefs(angry, objRef, calmCb as RefCallback<HTMLDivElement>);
      const cleanup = merged(node);

      // The throw must not break the chain — refs registered after the
      // angry one still attach to the node.
      expect(objRef.current).toBe(node);
      expect(calmCb).toHaveBeenCalledExactlyOnceWith(node);
      expect(errorSpy).toHaveBeenCalled();

      cleanup?.();
      expect(objRef.current).toBeNull();
      expect(calmCb).toHaveBeenLastCalledWith(null);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("isolates a throwing cleanup so later cleanups still run", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const angryCleanup = vi.fn(() => {
        throw new Error("angry cleanup");
      });
      const angryCb: RefCallback<HTMLDivElement> = () => angryCleanup;
      const objRef: MutableRefObject<HTMLDivElement | null> = { current: null };
      const tailCleanup = vi.fn();
      const tailCb: RefCallback<HTMLDivElement> = () => tailCleanup;
      const node = document.createElement("div");

      const merged = mergeRefs(angryCb, objRef, tailCb);
      const cleanup = merged(node);

      expect(objRef.current).toBe(node);
      cleanup?.();

      // Even after angryCleanup throws, the chart-style cleanups behind it
      // must still run — otherwise the ECharts instance and the WeakMap
      // entry leak.
      expect(angryCleanup).toHaveBeenCalledOnce();
      expect(objRef.current).toBeNull();
      expect(tailCleanup).toHaveBeenCalledOnce();
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
