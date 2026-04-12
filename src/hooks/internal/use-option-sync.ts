import { useEffect } from "react";
import type { ECharts, SetOptionOpts, EChartsOption } from "echarts";
import { shallowEqual } from "../../utils/shallow-equal";
import { logError } from "./log-error";
import type { LastApplied } from "./types";

/**
 * Internal hook: Sync option changes to the ECharts instance.
 * Skips duplicate setOption calls after init and when option is shallowly equal.
 * 内部 hook：将 option 变更同步到 ECharts 实例。
 * 在 init 后以及 option 浅比较相等时跳过重复的 setOption 调用。
 */
export function useOptionSync(
  getInstance: () => ECharts | undefined,
  option: EChartsOption,
  setOptionOpts: SetOptionOpts | undefined,
  lastAppliedRef: React.MutableRefObject<LastApplied | null>,
  onErrorRef: React.RefObject<((e: unknown) => void) | undefined>,
): void {
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    // Skip if init effect already applied this exact option
    const last = lastAppliedRef.current;
    if (last && shallowEqual(last.option, option) && last.opts === setOptionOpts) return;

    try {
      instance.setOption(option, setOptionOpts);
      lastAppliedRef.current = { option, opts: setOptionOpts };
    } catch (error) {
      logError(error, "ECharts setOption failed:", onErrorRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable containers read for latest values
  }, [getInstance, option, setOptionOpts]);
}
