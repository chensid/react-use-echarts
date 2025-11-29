import React, { useRef } from "react";
import { useEcharts } from "../../src";
import type { EChartsOption } from "echarts";

const BarChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  const options: EChartsOption = {
    title: { text: "Basic Bar Chart Example" },
    tooltip: {},
    xAxis: { data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    yAxis: {},
    series: [
      { name: "Sales", type: "bar", data: [23, 24, 18, 25, 27, 28, 25] },
    ],
  };

  useEcharts(chartRef, { option: options });

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
};

export default BarChart;
