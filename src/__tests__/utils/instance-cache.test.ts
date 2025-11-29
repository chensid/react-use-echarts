import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCachedInstance,
  setCachedInstance,
  replaceCachedInstance,
  releaseCachedInstance,
  getReferenceCount,
  clearInstanceCache,
} from "../../utils/instance-cache";
import type { ECharts } from "echarts";

// Create mock instance factory
function createMockInstance() {
  return {
    setOption: vi.fn(),
    dispose: vi.fn(),
    showLoading: vi.fn(),
    hideLoading: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getDom: vi.fn(),
    resize: vi.fn(),
  } as unknown as ECharts;
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

    it("should increment ref count for existing element", () => {
      const element = document.createElement("div");
      const instance1 = createMockInstance();
      const instance2 = createMockInstance();

      setCachedInstance(element, instance1);
      const result = setCachedInstance(element, instance2);

      // Should return the original cached instance
      expect(result).toBe(instance1);
      expect(getReferenceCount(element)).toBe(2);
    });
  });

  describe("replaceCachedInstance", () => {
    it("should replace existing instance keeping ref count", () => {
      const element = document.createElement("div");
      const instance1 = createMockInstance();
      const instance2 = createMockInstance();

      setCachedInstance(element, instance1);
      setCachedInstance(element, instance1); // refCount = 2

      const result = replaceCachedInstance(element, instance2);

      expect(result).toBe(instance2);
      expect(getCachedInstance(element)).toBe(instance2);
      expect(getReferenceCount(element)).toBe(2); // ref count preserved
    });

    it("should create new entry if element not cached", () => {
      const element = document.createElement("div");
      const instance = createMockInstance();

      const result = replaceCachedInstance(element, instance);

      expect(result).toBe(instance);
      expect(getReferenceCount(element)).toBe(1);
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

