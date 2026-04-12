import type { EChartsOption, SetOptionOpts } from "echarts";

/**
 * Tracks the last option/opts applied to the ECharts instance.
 * Shared between useInstanceLifecycle (writes on init) and useOptionSync (reads to skip duplicates).
 */
export interface LastApplied {
  option: EChartsOption;
  opts: SetOptionOpts | undefined;
}
