import React, { useRef } from "react";
import { useEcharts } from "../../src";
import type { EChartsOption } from "echarts";

const LinkedCharts: React.FC = () => {
  const chartRef1 = useRef<HTMLDivElement>(null);
  const chartRef2 = useRef<HTMLDivElement>(null);

  const option1: EChartsOption = {
    title: { text: "Chart A (linked)" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: [50, 80, 60, 100, 70, 90] }],
  };

  const option2: EChartsOption = {
    title: { text: "Chart B (linked)" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
    yAxis: { type: "value" },
    series: [{ type: "line", data: [30, 60, 40, 80, 50, 70] }],
  };

  useEcharts(chartRef1, { option: option1, group: "dashboard" });
  useEcharts(chartRef2, { option: option2, group: "dashboard" });

  return (
    <div className="grid-2">
      <div ref={chartRef1} className="chart-container" />
      <div ref={chartRef2} className="chart-container" />
    </div>
  );
};

export default LinkedCharts;
