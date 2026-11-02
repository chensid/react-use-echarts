import * as echarts from "echarts/core";
import type { ECharts } from "echarts/core";

/**
 * ECharts declares `group: string` (JSDoc-tagged `@readonly`), yet assigning it
 * is the documented way to join a group (see echarts.apache.org/en/api.html#bindGroup).
 * Widened to optional so removeFromGroup can unset it.
 */
type EChartsWithGroup = Omit<ECharts, "group"> & { group?: string };

/**
 * Members per group. An entry is created — and `echarts.connect` called — on
 * the group's first join, and dropped with `echarts.disconnect` once it empties.
 * 每个组的成员集合：首个成员加入时创建并调用 echarts.connect，组变空时删除并 disconnect。
 */
const groupMembers = new Map<string, Set<ECharts>>();

function pruneDisposed(group: Set<ECharts>): void {
  // Deleting the current entry mid-iteration is spec-safe for a Set, so no
  // scratch copy is needed on this per-join/leave/query path.
  for (const inst of group) {
    if (inst.isDisposed()) {
      group.delete(inst);
    }
  }
}

/**
 * Best-effort sweep: drop disposed instances from every group and tear down any
 * left empty. The normal unmount path already cleans up via leaveGroup, but a
 * consumer that disposes an instance directly (bypassing the cache) strands it
 * in `groupMembers`; running this on every join bounds that leak. It can't
 * reclaim a group after ALL group activity stops — that needs
 * WeakRef/FinalizationRegistry, overkill for a misuse edge case.
 * 尽力清扫：剔除各组已 dispose 的实例并拆除空组。正常卸载路径已能清理；消费者绕过缓存直接
 * dispose 会留下孤儿，此清扫把泄漏限定在「应用彻底停止组活动」之前。
 */
function sweepDisposedGroups(): void {
  for (const [groupId, members] of groupMembers) {
    pruneDisposed(members);
    if (members.size > 0) continue;
    // Deleting the current key mid-iteration is safe for a Map.
    groupMembers.delete(groupId);
    echarts.disconnect(groupId);
  }
}

/**
 * Add chart instance to group
 * 将图表实例添加到组
 */
export function addToGroup(instance: ECharts, groupId: string): void {
  // Reclaim groups orphaned by a cache-bypassing instance.dispose() first; this
  // also prunes the target group, and may drop it so it's recreated (and
  // re-connected) below.
  sweepDisposedGroups();

  let members = groupMembers.get(groupId);
  const isNewGroup = !members;
  if (!members) {
    members = new Set();
    groupMembers.set(groupId, members);
  }

  (instance as EChartsWithGroup).group = groupId;
  members.add(instance);

  if (isNewGroup) {
    echarts.connect(groupId);
  }
}

/**
 * Remove chart instance from group
 * 从组中移除图表实例
 */
export function removeFromGroup(instance: ECharts, groupId: string): void {
  const members = groupMembers.get(groupId);
  if (!members) return;

  pruneDisposed(members);
  members.delete(instance);

  if ((instance as EChartsWithGroup).group === groupId) {
    (instance as EChartsWithGroup).group = undefined;
  }

  // Drop the group with its last member, so long-lived apps with dynamic group
  // ids don't leak module state or a stale `echarts.connectedGroups[id]` flag.
  if (members.size === 0) {
    groupMembers.delete(groupId);
    echarts.disconnect(groupId);
  }
}

/**
 * Remove an instance from whatever group it currently belongs to (if any).
 * 让实例脱离当前所在的组（若存在），集中表达 dispose 前的所有权清理。
 */
export function leaveGroup(instance: ECharts): void {
  const groupId = getInstanceGroup(instance);
  if (groupId) {
    removeFromGroup(instance, groupId);
  }
}

/**
 * Move an instance from `oldGroupId` to `newGroupId` (either may be absent)
 * 将实例从旧组移到新组（两者均可为空）
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
 */
export function getInstanceGroup(instance: ECharts): string | undefined {
  return (instance as EChartsWithGroup).group;
}

/**
 * Clear all groups (for testing/cleanup)
 * 清除所有组（用于测试/清理）
 */
export function clearGroups(): void {
  for (const groupId of groupMembers.keys()) {
    echarts.disconnect(groupId);
  }
  groupMembers.clear();
}
