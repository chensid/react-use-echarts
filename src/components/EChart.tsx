import { forwardRef, useRef, useImperativeHandle } from "react";
import useEcharts from "../hooks/use-echarts";
import type { EChartProps } from "../types";
import type { UseEchartsReturn } from "../types";

/**
 * Declarative EChart component — thin wrapper around useEcharts
 * 声明式 EChart 组件 — useEcharts 的薄封装
 *
 * @example
 * ```tsx
 * <EChart option={{ series: [{ type: 'line', data: [1,2,3] }] }} />
 * ```
 */
const EChart = forwardRef<UseEchartsReturn, EChartProps>(
  ({ style, className, ...options }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chart = useEcharts(containerRef, options);
    useImperativeHandle(ref, () => chart, [chart]);
    return (
      <div
        ref={containerRef}
        style={{ width: "100%", height: "400px", ...style }}
        className={className}
      />
    );
  }
);

EChart.displayName = "EChart";

export default EChart;
