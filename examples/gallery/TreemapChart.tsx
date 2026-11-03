import React from "react";
import * as echarts from "echarts/core";
import { TreemapChart } from "echarts/charts";
import { TitleComponent, TooltipComponent } from "echarts/components";
import { useEcharts, type EChartsOption } from "react-use-echarts";
import { useTheme } from "../components/theme-context";

echarts.use([TreemapChart, TitleComponent, TooltipComponent]);

const TreemapChartDemo: React.FC = () => {
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

  const { ref } = useEcharts({ option, theme: mode });

  return <div ref={ref} className="chart-container-sm" />;
};

export default TreemapChartDemo;
