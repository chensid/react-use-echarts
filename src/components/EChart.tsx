import { useRef, useImperativeHandle, type Ref } from "react";
import useEcharts from "../hooks/use-echarts";
import type { EChartProps, UseEchartsReturn } from "../types";

/**
 * Declarative EChart component — thin wrapper around useEcharts
 * 声明式 EChart 组件 — useEcharts 的薄封装
 *
 * Default container style: `{ width: '100%', height: '100%' }`.
 * The parent must have an explicit height; override either via the `style` prop.
 *
 * @example
 * ```tsx
 * <EChart option={{ series: [{ type: 'line', data: [1,2,3] }] }} />
 * ```
 */
function EChart({
  ref,
  style,
  className,
  ...options
}: EChartProps & { ref?: Ref<UseEchartsReturn> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chart = useEcharts(containerRef, options);
  useImperativeHandle(ref, () => chart, [chart]);
  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", ...style }}
      className={className}
    />
  );
}

export default EChart;
