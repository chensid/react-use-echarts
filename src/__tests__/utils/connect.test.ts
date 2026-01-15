import { describe, it, expect, vi, beforeEach } from "vitest";
import * as echarts from "echarts";
import {
  addToGroup,
  removeFromGroup,
  updateGroup,
  getGroupInstances,
  getInstanceGroup,
  isInGroup,
  clearGroups,
} from "../../utils/connect";

// Mock ECharts
vi.mock("echarts", () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
}));

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
    group: undefined,
  } as unknown as echarts.ECharts;
}

describe("connect utilities", () => {
  beforeEach(() => {
    clearGroups();
    vi.clearAllMocks();
  });

  describe("addToGroup", () => {
    it("should add instance to new group", () => {
      const instance = createMockInstance();
      addToGroup(instance, "group1");

      expect(getGroupInstances("group1")).toContain(instance);
      expect(instance.group).toBe("group1");
      // Single instance should not trigger connect
      expect(echarts.connect).not.toHaveBeenCalled();
    });

    it("should connect when group has multiple instances", () => {
      const instance1 = createMockInstance();
      const instance2 = createMockInstance();

      addToGroup(instance1, "group1");
      addToGroup(instance2, "group1");

      expect(echarts.connect).toHaveBeenCalledWith("group1");
      expect(getGroupInstances("group1")).toHaveLength(2);
    });

    it("should handle adding to multiple groups", () => {
      const instance1 = createMockInstance();
      const instance2 = createMockInstance();
      const instance3 = createMockInstance();

      addToGroup(instance1, "groupA");
      addToGroup(instance2, "groupA");
      addToGroup(instance3, "groupB");

      expect(getGroupInstances("groupA")).toHaveLength(2);
      expect(getGroupInstances("groupB")).toHaveLength(1);
    });
  });

  describe("removeFromGroup", () => {
    it("should remove instance from group", () => {
      const instance1 = createMockInstance();
      const instance2 = createMockInstance();

      addToGroup(instance1, "group1");
      addToGroup(instance2, "group1");

      removeFromGroup(instance1, "group1");

      expect(getGroupInstances("group1")).not.toContain(instance1);
      expect(getGroupInstances("group1")).toContain(instance2);
      expect(instance1.group).toBeUndefined();
      expect(instance2.group).toBe("group1");
    });

    it("should disconnect when group becomes empty", () => {
      const instance = createMockInstance();

      addToGroup(instance, "group1");
      removeFromGroup(instance, "group1");

      expect(echarts.disconnect).toHaveBeenCalledWith("group1");
      expect(getGroupInstances("group1")).toHaveLength(0);
    });

    it("should disconnect when only one instance remains", () => {
      const instance1 = createMockInstance();
      const instance2 = createMockInstance();

      addToGroup(instance1, "group1");
      addToGroup(instance2, "group1");
      vi.clearAllMocks();

      removeFromGroup(instance1, "group1");

      expect(echarts.disconnect).toHaveBeenCalledWith("group1");
    });

    it("should reconnect when multiple instances remain", () => {
      const instance1 = createMockInstance();
      const instance2 = createMockInstance();
      const instance3 = createMockInstance();

      addToGroup(instance1, "group1");
      addToGroup(instance2, "group1");
      addToGroup(instance3, "group1");
      vi.clearAllMocks();

      removeFromGroup(instance1, "group1");

      expect(echarts.connect).toHaveBeenCalledWith("group1");
      expect(getGroupInstances("group1")).toHaveLength(2);
    });

    it("should handle removing from non-existent group", () => {
      const instance = createMockInstance();
      // Should not throw
      removeFromGroup(instance, "nonexistent");
      expect(echarts.disconnect).not.toHaveBeenCalled();
    });
  });

  describe("updateGroup", () => {
    it("should move instance from old group to new group", () => {
      const instance = createMockInstance();

      addToGroup(instance, "oldGroup");
      updateGroup(instance, "oldGroup", "newGroup");

      expect(getGroupInstances("oldGroup")).not.toContain(instance);
      expect(getGroupInstances("newGroup")).toContain(instance);
      expect(instance.group).toBe("newGroup");
    });

    it("should only add to new group when no old group", () => {
      const instance = createMockInstance();

      updateGroup(instance, undefined, "newGroup");

      expect(getGroupInstances("newGroup")).toContain(instance);
      expect(instance.group).toBe("newGroup");
    });

    it("should only remove from old group when no new group", () => {
      const instance = createMockInstance();

      addToGroup(instance, "oldGroup");
      updateGroup(instance, "oldGroup", undefined);

      expect(getGroupInstances("oldGroup")).not.toContain(instance);
      expect(instance.group).toBeUndefined();
    });

    it("should handle both undefined", () => {
      const instance = createMockInstance();
      // Should not throw
      updateGroup(instance, undefined, undefined);
    });
  });

  describe("getGroupInstances", () => {
    it("should return empty array for non-existent group", () => {
      expect(getGroupInstances("nonexistent")).toEqual([]);
    });

    it("should return all instances in group", () => {
      const instance1 = createMockInstance();
      const instance2 = createMockInstance();

      addToGroup(instance1, "group1");
      addToGroup(instance2, "group1");

      const instances = getGroupInstances("group1");
      expect(instances).toContain(instance1);
      expect(instances).toContain(instance2);
    });
  });

  describe("getInstanceGroup", () => {
    it("should return group ID for instance in group", () => {
      const instance = createMockInstance();
      addToGroup(instance, "myGroup");

      expect(getInstanceGroup(instance)).toBe("myGroup");
    });

    it("should return undefined for instance not in any group", () => {
      const instance = createMockInstance();
      expect(getInstanceGroup(instance)).toBeUndefined();
    });
  });

  describe("isInGroup", () => {
    it("should return true for instance in group", () => {
      const instance = createMockInstance();
      addToGroup(instance, "group1");

      expect(isInGroup(instance)).toBe(true);
    });

    it("should return false for instance not in any group", () => {
      const instance = createMockInstance();
      expect(isInGroup(instance)).toBe(false);
    });
  });

  describe("clearGroups", () => {
    it("should disconnect all groups and clear registry", () => {
      const instance1 = createMockInstance();
      const instance2 = createMockInstance();

      addToGroup(instance1, "group1");
      addToGroup(instance2, "group2");
      vi.clearAllMocks();

      clearGroups();

      expect(echarts.disconnect).toHaveBeenCalledWith("group1");
      expect(echarts.disconnect).toHaveBeenCalledWith("group2");
      expect(getGroupInstances("group1")).toHaveLength(0);
      expect(getGroupInstances("group2")).toHaveLength(0);
    });
  });
});

