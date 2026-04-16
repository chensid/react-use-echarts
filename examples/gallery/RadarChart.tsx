import React, { useRef } from "react";
import { useEcharts } from "../../src";
import { useTheme } from "../components/theme-context";
import type { EChartsOption } from "echarts";

const RadarChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { mode } = useTheme();

  const option: EChartsOption = {
    backgroundColor: "transparent",
    title: { text: "Skill Assessment" },
    tooltip: { trigger: "item" },
    legend: { bottom: 0, data: ["Alice", "Bob"] },
    radar: {
      indicator: [
        { name: "Frontend", max: 100 },
        { name: "Backend", max: 100 },
        { name: "DevOps", max: 100 },
        { name: "Design", max: 100 },
        { name: "Testing", max: 100 },
        { name: "Communication", max: 100 },
      ],
    },
    series: [
      {
        type: "radar",
        data: [
          { value: [90, 65, 50, 80, 70, 85], name: "Alice" },
          { value: [60, 90, 85, 40, 80, 70], name: "Bob" },
        ],
        areaStyle: { opacity: 0.15 },
      },
    ],
  };

  useEcharts(chartRef, { option, theme: mode });

  return <div ref={chartRef} className="chart-container-sm" />;
};

export default RadarChart;
