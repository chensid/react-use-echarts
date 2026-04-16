import React, { useRef } from "react";
import { useEcharts } from "../../src";
import { useTheme } from "../components/theme-context";
import type { EChartsOption } from "echarts";

const TreemapChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { mode } = useTheme();

  const option: EChartsOption = {
    backgroundColor: "transparent",
    title: { text: "Disk Usage", left: "center" },
    tooltip: { formatter: "{b}: {c} GB" },
    series: [
      {
        type: "treemap",
        roam: false,
        breadcrumb: { show: false },
        label: { show: true, formatter: "{b}\n{c} GB" },
        data: [
          {
            name: "Documents",
            value: 120,
            children: [
              { name: "Projects", value: 65 },
              { name: "Archives", value: 35 },
              { name: "Notes", value: 20 },
            ],
          },
          {
            name: "Media",
            value: 90,
            children: [
              { name: "Photos", value: 45 },
              { name: "Videos", value: 30 },
              { name: "Music", value: 15 },
            ],
          },
          {
            name: "Applications",
            value: 60,
            children: [
              { name: "Dev Tools", value: 35 },
              { name: "Utilities", value: 25 },
            ],
          },
          { name: "System", value: 40 },
        ],
      },
    ],
  };

  useEcharts(chartRef, { option, theme: mode });

  return <div ref={chartRef} className="chart-container-sm" />;
};

export default TreemapChart;
