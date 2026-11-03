import React from "react";
import * as echarts from "echarts/core";
import { RadarChart } from "echarts/charts";
import {
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import { useEcharts, type EChartsOption } from "react-use-echarts";
import { useTheme } from "../components/theme-context";

echarts.use([RadarChart, LegendComponent, RadarComponent, TitleComponent, TooltipComponent]);

const RadarChartDemo: React.FC = () => {
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

  const { ref } = useEcharts({ option, theme: mode });

  return <div ref={ref} className="chart-container-sm" />;
};

export default RadarChartDemo;
