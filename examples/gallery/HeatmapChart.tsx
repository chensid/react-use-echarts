import React, { useMemo, useRef } from "react";
import { useEcharts } from "../../src";
import { useTheme } from "../components/theme-context";
import type { EChartsOption } from "echarts";

const HOURS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS = ["Morning", "Afternoon", "Evening", "Night"];

function generateData() {
  const data: [number, number, number][] = [];
  for (let i = 0; i < HOURS.length; i++) {
    for (let j = 0; j < SLOTS.length; j++) {
      data.push([i, j, Math.floor(Math.random() * 10)]);
    }
  }
  return data;
}

const HeatmapChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { mode } = useTheme();
  const heatmapData = useMemo(() => generateData(), []);

  const option: EChartsOption = {
    backgroundColor: "transparent",
    title: { text: "Activity Heatmap" },
    tooltip: {
      position: "top",
      formatter: (params: unknown) => {
        const p = params as { value: number[] };
        return `${HOURS[p.value[0]]} ${SLOTS[p.value[1]]}: <b>${p.value[2]}</b>`;
      },
    },
    xAxis: { type: "category", data: HOURS, splitArea: { show: true } },
    yAxis: { type: "category", data: SLOTS, splitArea: { show: true } },
    visualMap: {
      min: 0,
      max: 10,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 0,
      itemWidth: 12,
      itemHeight: 80,
    },
    grid: { top: 50, bottom: 60, left: 80, right: 20 },
    series: [
      {
        type: "heatmap",
        data: heatmapData,
        label: { show: true },
        emphasis: { itemStyle: { shadowBlur: 6, shadowColor: "rgba(0,0,0,0.25)" } },
      },
    ],
  };

  useEcharts(chartRef, { option, theme: mode });

  return <div ref={chartRef} className="chart-container-sm" />;
};

export default HeatmapChart;
