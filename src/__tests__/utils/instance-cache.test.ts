import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import {
  getCachedInstance,
  setCachedInstance,
  releaseCachedInstance,
  getReferenceCount,
  clearInstanceCache,
} from "../../utils/instance-cache";
import type { ECharts } from "echarts";
import { createMockInstance as createBaseMockInstance } from "../helpers";

function createMockInstance() {
  return createBaseMockInstance() as unknown as ECharts;
}

describe("instance-cache utilities", () => {
  beforeEach(() => {
    clearInstanceCache();
    vi.clearAllMocks();
  });

  describe("getCachedInstance", () => {
    it("should return undefined for uncached element", () => {
      const element = document.createElement("div");
      expect(getCachedInstance(element)).toBeUndefined();
    });

    it("should return cached instance", () => {
      const element = document.createElement("div");
      const instance = createMockInstance();

      setCachedInstance(element, instance);

      expect(getCachedInstance(element)).toBe(instance);
    });
  });

  describe("setCachedInstance", () => {
    it("should cache new instance with ref count 1", () => {
      const element = document.createElement("div");
      const instance = createMockInstance();

      const result = setCachedInstance(element, instance);

      expect(result).toBe(instance);
      expect(getReferenceCount(element)).toBe(1);
    });

    it("should increment ref count for existing element with same instance", () => {
      const element = document.createElement("div");
      const instance = createMockInstance();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      setCachedInstance(element, instance);
      const result = setCachedInstance(element, instance);

      expect(result).toBe(instance);
      expect(getReferenceCount(element)).toBe(2);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("should warn and keep the cached instance when called with a different one", () => {
      const element = document.createElement("div");
      const instance1 = createMockInstance();
      const instance2 = createMockInstance();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      setCachedInstance(element, instance1);
      const result = setCachedInstance(element, instance2);

      expect(result).toBe(instance1);
      expect(getReferenceCount(element)).toBe(2);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("called with a different instance"),
      );
      warnSpy.mockRestore();
    });
  });

  describe("releaseCachedInstance", () => {
    it("should decrement ref count", () => {
      const element = document.createElement("div");
      const instance = createMockInstance();

      setCachedInstance(element, instance);
      setCachedInstance(element, instance); // refCount = 2

      releaseCachedInstance(element);

      expect(getReferenceCount(element)).toBe(1);
      expect(instance.dispose).not.toHaveBeenCalled();
    });

    it("should dispose and remove when ref count reaches zero", () => {
      const element = document.createElement("div");
      const instance = createMockInstance();

      setCachedInstance(element, instance);
      releaseCachedInstance(element);

      expect(instance.dispose).toHaveBeenCalled();
      expect(getCachedInstance(element)).toBeUndefined();
      expect(getReferenceCount(element)).toBe(0);
    });

    it("should handle releasing non-cached element", () => {
      const element = document.createElement("div");
      // Should not throw
      releaseCachedInstance(element);
      expect(getReferenceCount(element)).toBe(0);
    });
  });

  describe("clearInstanceCache", () => {
    it("should dispose all tracked instances", () => {
      const el1 = document.createElement("div");
      const el2 = document.createElement("div");
      const instance1 = createMockInstance();
      const instance2 = createMockInstance();

      setCachedInstance(el1, instance1);
      setCachedInstance(el2, instance2);

      clearInstanceCache();

      expect(instance1.dispose).toHaveBeenCalled();
      expect(instance2.dispose).toHaveBeenCalled();
      expect(getCachedInstance(el1)).toBeUndefined();
      expect(getCachedInstance(el2)).toBeUndefined();
    });
  });

  describe("getReferenceCount", () => {
    it("should return 0 for uncached element", () => {
      const element = document.createElement("div");
      expect(getReferenceCount(element)).toBe(0);
    });

    it("should return correct ref count", () => {
      const element = document.createElement("div");
      const instance = createMockInstance();

      setCachedInstance(element, instance);
      expect(getReferenceCount(element)).toBe(1);

      setCachedInstance(element, instance);
      expect(getReferenceCount(element)).toBe(2);

      releaseCachedInstance(element);
      expect(getReferenceCount(element)).toBe(1);
    });
  });
});
