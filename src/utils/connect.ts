import * as echarts from "echarts";
import type { ECharts } from "echarts";

/**
 * ECharts documents `instance.group = 'xxx'` as the standard pattern for
 * group assignment (see echarts.apache.org/en/api.html#bindGroup).
 * The TypeScript declaration has a @readonly JSDoc tag, but the property is
 * intentionally writable at runtime. This cast is the official usage pattern.
 */
type EChartsWithGroup = Omit<ECharts, "group"> & { group?: string };

/**
 * Per-group membership for `pruneDisposed` and `getGroupInstances`.
 * 每个组的成员集合，仅用于过滤已 dispose 的实例与 getGroupInstances 查询。
 */
const groupMembers = new Map<string, Set<ECharts>>();

/**
 * Group IDs we've already called `echarts.connect` for, so we don't redundantly
 * re-connect on every add. Pruned when the last member leaves the group
 * (see removeFromGroup) and on `clearGroups`.
 * 已经调用过 echarts.connect 的 group ID 集合，避免重复 connect；
 * 最后一个成员离开后由 removeFromGroup 清理。
 */
const connectedGroupIds = new Set<string>();

function pruneDisposed(group: Set<ECharts>): void {
  const disposed: ECharts[] = [];
  for (const inst of group) {
    if (inst.isDisposed()) {
      disposed.push(inst);
    }
  }
  for (const inst of disposed) {
    group.delete(inst);
  }
}

/**
 * Add chart instance to group
 * 将图表实例添加到组
 * @param instance ECharts instance
 * @param groupId Group ID
 */
export function addToGroup(instance: ECharts, groupId: string): void {
  let members = groupMembers.get(groupId);
  if (!members) {
    members = new Set();
    groupMembers.set(groupId, members);
  }
  pruneDisposed(members);

  (instance as EChartsWithGroup).group = groupId;
  members.add(instance);

  if (!connectedGroupIds.has(groupId)) {
    echarts.connect(groupId);
    connectedGroupIds.add(groupId);
  }
}

/**
 * Remove chart instance from group
 * 从组中移除图表实例
 * @param instance ECharts instance
 * @param groupId Group ID
 */
export function removeFromGroup(instance: ECharts, groupId: string): void {
  const members = groupMembers.get(groupId);
  if (!members) return;

  pruneDisposed(members);
  members.delete(instance);

  if ((instance as EChartsWithGroup).group === groupId) {
    (instance as EChartsWithGroup).group = undefined;
  }

  // When the last member leaves, drop all bookkeeping for this groupId so
  // long-lived apps with dynamic group values don't leak module state or
  // a stale `echarts.connectedGroups[id] = true` flag.
  if (members.size === 0) {
    groupMembers.delete(groupId);
    connectedGroupIds.delete(groupId);
    echarts.disconnect(groupId);
  }
}

/**
 * Remove an instance from whatever group it currently belongs to (if any).
 * Centralizes the "look up own group → leave it" pattern so dispose paths
 * don't have to inline `getInstanceGroup` + `removeFromGroup`.
 * 让实例脱离当前所在的组（若存在），集中表达 dispose 前的所有权清理。
 */
export function leaveGroup(instance: ECharts): void {
  const groupId = getInstanceGroup(instance);
  if (groupId) {
    removeFromGroup(instance, groupId);
  }
}

/**
 * Update group for chart instance
 * 更新图表实例的组
 * @param instance ECharts instance
 * @param oldGroupId Previous group ID (if any)
 * @param newGroupId New group ID (if any)
 */
export function updateGroup(instance: ECharts, oldGroupId?: string, newGroupId?: string): void {
  if (oldGroupId) {
    removeFromGroup(instance, oldGroupId);
  }
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
  const members = groupMembers.get(groupId);
  if (!members) return [];
  pruneDisposed(members);
  return Array.from(members);
}

/**
 * Get group ID for an instance
 * 获取实例所属的组 ID
 * @param instance ECharts instance
 * @returns Group ID or undefined
 */
export function getInstanceGroup(instance: ECharts): string | undefined {
  return (instance as EChartsWithGroup).group;
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
  for (const groupId of connectedGroupIds) {
    echarts.disconnect(groupId);
  }
  connectedGroupIds.clear();
  groupMembers.clear();
}
