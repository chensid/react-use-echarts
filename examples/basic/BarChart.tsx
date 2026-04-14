import React, { useRef } from "react";
import { useEcharts } from "../../src";
import type { EChartsOption } from "echarts";

const BarChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  const options: EChartsOption = {
    backgroundColor: "transparent",
    title: { text: "Weekly Sales" },
    tooltip: {},
    xAxis: { data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    yAxis: {},
    series: [{ name: "Sales", type: "bar", data: [23, 24, 18, 25, 27, 28, 25] }],
  };

  useEcharts(chartRef, { option: options });

  return <div ref={chartRef} className="chart-container" />;
};

export default BarChart;
