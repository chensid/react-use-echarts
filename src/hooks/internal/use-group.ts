import { useEffect } from "react";
import type { ECharts } from "echarts";
import { updateGroup, getInstanceGroup } from "../../utils/connect";

/**
 * Internal hook: Manage chart group membership.
 * 内部 hook：管理图表的组成员关系。
 */
export function useGroup(getInstance: () => ECharts | undefined, group: string | undefined): void {
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    const currentGroup = getInstanceGroup(instance);
    if (currentGroup === group) return;

    updateGroup(instance, currentGroup, group);
  }, [getInstance, group]);
}
