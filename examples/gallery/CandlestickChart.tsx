import React, { useRef } from "react";
import { useEcharts } from "../../src";
import { useTheme } from "../components/theme-context";
import type { EChartsOption } from "echarts";

const CandlestickChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { mode } = useTheme();

  const dates = ["Apr 1", "Apr 2", "Apr 3", "Apr 4", "Apr 7", "Apr 8", "Apr 9", "Apr 10"];
  // [open, close, low, high]
  const data = [
    [116, 129, 112, 132],
    [128, 133, 126, 136],
    [132, 127, 124, 134],
    [128, 136, 126, 140],
    [135, 131, 128, 138],
    [130, 142, 128, 145],
    [141, 138, 134, 144],
    [137, 145, 135, 148],
  ];

  const option: EChartsOption = {
    backgroundColor: "transparent",
    title: { text: "Stock Price" },
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    xAxis: { type: "category", data: dates, boundaryGap: true },
    yAxis: { type: "value", scale: true, splitArea: { show: true } },
    series: [{ type: "candlestick", data }],
    grid: { top: 50, bottom: 30, left: 50, right: 20 },
  };

  useEcharts(chartRef, { option, theme: mode });

  return <div ref={chartRef} className="chart-container-sm" />;
};

export default CandlestickChart;
