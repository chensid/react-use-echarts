import * as echarts from "echarts";
import type { ECharts } from "echarts";

/**
 * Global registry for chart groups
 * 图表组的全局注册表
 * Key: groupId, Value: Set of chart instances
 */
const groupRegistry = new Map<string, Set<ECharts>>();

/**
 * Add chart instance to group
 * 将图表实例添加到组
 * @param instance ECharts instance
 * @param groupId Group ID
 */
export function addToGroup(instance: ECharts, groupId: string): void {
  if (!groupRegistry.has(groupId)) {
    groupRegistry.set(groupId, new Set());
  }

  const group = groupRegistry.get(groupId)!;
  group.add(instance);

  // Connect all instances in the group
  if (group.size > 1) {
    echarts.connect(groupId);
  }
}

/**
 * Remove chart instance from group
 * 从组中移除图表实例
 * @param instance ECharts instance
 * @param groupId Group ID
 */
export function removeFromGroup(instance: ECharts, groupId: string): void {
  const group = groupRegistry.get(groupId);

  if (!group) {
    return;
  }

  group.delete(instance);

  // If group becomes empty, clean up
  if (group.size === 0) {
    groupRegistry.delete(groupId);
    echarts.disconnect(groupId);
  }
  // If group has only one instance left, disconnect
  else if (group.size === 1) {
    echarts.disconnect(groupId);
  }
  // If group still has multiple instances, reconnect
  else {
    echarts.connect(groupId);
  }
}

/**
 * Update group for chart instance
 * 更新图表实例的组
 * @param instance ECharts instance
 * @param oldGroupId Previous group ID (if any)
 * @param newGroupId New group ID (if any)
 */
export function updateGroup(
  instance: ECharts,
  oldGroupId?: string,
  newGroupId?: string
): void {
  // Remove from old group if exists
  if (oldGroupId) {
    removeFromGroup(instance, oldGroupId);
  }

  // Add to new group if provided
  if (newGroupId) {
    addToGroup(instance, newGroupId);
  }
}

/**
 * Get all instances in a group
 * 获取组中的所有实例
 * @param groupId Group ID
 * @returns Array of chart instances
 */
export function getGroupInstances(groupId: string): ECharts[] {
  const group = groupRegistry.get(groupId);
  return group ? Array.from(group) : [];
}

/**
 * Get group ID for an instance
 * 获取实例所属的组 ID
 * @param instance ECharts instance
 * @returns Group ID or undefined
 */
export function getInstanceGroup(instance: ECharts): string | undefined {
  for (const [groupId, instances] of groupRegistry.entries()) {
    if (instances.has(instance)) {
      return groupId;
    }
  }
  return undefined;
}

/**
 * Check if instance is in any group
 * 检查实例是否在任何组中
 * @param instance ECharts instance
 * @returns True if in a group
 */
export function isInGroup(instance: ECharts): boolean {
  return getInstanceGroup(instance) !== undefined;
}

/**
 * Clear all groups (for testing/cleanup)
 * 清除所有组（用于测试/清理）
 */
export function clearGroups(): void {
  // Disconnect all groups
  for (const groupId of groupRegistry.keys()) {
    echarts.disconnect(groupId);
  }
  groupRegistry.clear();
}
