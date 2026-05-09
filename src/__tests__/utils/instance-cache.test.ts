import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import {
  getCachedInstance,
  setCachedInstance,
  releaseCachedInstance,
  getReferenceCount,
  clearInstanceCache,
} from "../../utils/instance-cache";
import { addToGroup, clearGroups, getGroupInstances } from "../../utils/connect";
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
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const element = document.createElement("div");
        const instance1 = createMockInstance();
        const instance2 = createMockInstance();

        setCachedInstance(element, instance1);
        const result = setCachedInstance(element, instance2);

        expect(result).toBe(instance1);
        expect(getReferenceCount(element)).toBe(2);
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining("called with a different instance"),
        );
      } finally {
        warnSpy.mockRestore();
        process.env.NODE_ENV = previousNodeEnv;
      }
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

    it("should clear cache bookkeeping in finally even when dispose throws", () => {
      // dispose doesn't throw on real ECharts, but cache bookkeeping is a
      // critical invariant — a stale entry would let later mounts reuse a
      // half-disposed instance.
      const element = document.createElement("div");
      const instance = createMockInstance();
      (instance.dispose as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("dispose failed");
      });

      setCachedInstance(element, instance);

      expect(() => releaseCachedInstance(element)).toThrow("dispose failed");
      expect(getCachedInstance(element)).toBeUndefined();
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

    it("should leave group memberships before disposing", () => {
      // Without leaveGroup integration, clearInstanceCache disposes instances
      // but leaves stale references in groupRegistry until pruneDisposed runs.
      clearGroups();

      const element = document.createElement("div");
      const instance = createMockInstance();
      setCachedInstance(element, instance);
      addToGroup(instance, "g1");

      expect(getGroupInstances("g1")).toContain(instance);

      clearInstanceCache();

      // The instance is gone from the group registry without relying on
      // pruneDisposed's lazy cleanup.
      expect(getGroupInstances("g1")).not.toContain(instance);
    });
  });

  describe("releaseCachedInstance disposal protocol", () => {
    it("should leave group before disposing when refCount hits zero", () => {
      clearGroups();

      const element = document.createElement("div");
      const instance = createMockInstance();
      setCachedInstance(element, instance);
      addToGroup(instance, "released-group");

      expect(getGroupInstances("released-group")).toContain(instance);

      releaseCachedInstance(element);

      // Centralized protocol: release path drops group ownership before
      // dispose so groupRegistry doesn't carry a disposed reference.
      expect(getGroupInstances("released-group")).not.toContain(instance);
      expect(instance.dispose).toHaveBeenCalled();
    });

    it("should preserve group while refCount remains above zero", () => {
      clearGroups();

      const element = document.createElement("div");
      const instance = createMockInstance();
      // Two consumers — refCount becomes 2.
      setCachedInstance(element, instance);
      setCachedInstance(element, instance);
      addToGroup(instance, "shared-group");

      // First release decrements to 1, no dispose, no leaveGroup.
      releaseCachedInstance(element);
      expect(instance.dispose).not.toHaveBeenCalled();
      expect(getGroupInstances("shared-group")).toContain(instance);

      // Last release disposes and leaves the group.
      releaseCachedInstance(element);
      expect(instance.dispose).toHaveBeenCalled();
      expect(getGroupInstances("shared-group")).not.toContain(instance);
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
