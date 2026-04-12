import { useEffect } from "react";
import type { ECharts } from "echarts";

/**
 * Internal hook: Toggle loading state on the ECharts instance.
 * 内部 hook：切换 ECharts 实例的 loading 状态。
 */
export function useLoading(
  getInstance: () => ECharts | undefined,
  showLoading: boolean,
  loadingOption: Record<string, unknown> | undefined,
): void {
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    if (showLoading) {
      instance.showLoading(loadingOption);
    } else {
      instance.hideLoading();
    }
  }, [getInstance, showLoading, loadingOption]);
}
