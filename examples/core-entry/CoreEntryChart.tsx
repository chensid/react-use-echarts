/**
 * Demonstrates the `react-use-echarts/core` subpath entry.
 *
 * The default `react-use-echarts` entry pulls in `"echarts"` for its
 * side-effect registration of every chart and component. The `/core` entry
 * skips that import, letting the consumer register only what's actually
 * rendered — bundlers then tree-shake away the rest of ECharts.
 *
 * Note: inside this example app every demo lives in the same bundle, so the
 * default entry's full echarts is already loaded by other routes. The
 * tree-shaking benefit is realized in a standalone consumer project that
 * imports ONLY from `react-use-echarts/core`.
 */
import React, { useRef } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, TitleComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useEcharts } from "../../src/core";
import { useTheme } from "../components/theme-context";
import type { EChartsOption } from "echarts";

// Register only the pieces this chart needs. ECharts maintains a single
// global registry, so `use()` calls compose across modules in the consumer
// application.
echarts.use([LineChart, GridComponent, TooltipComponent, TitleComponent, CanvasRenderer]);

const CoreEntryChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { mode } = useTheme();

  const options: EChartsOption = {
    backgroundColor: "transparent",
    title: { text: "Tree-shakable Line Chart" },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    yAxis: { type: "value" },
    series: [
      {
        data: [120, 200, 150, 80, 70, 110, 130],
        type: "line",
        smooth: true,
      },
    ],
  };

  useEcharts(chartRef, { option: options, theme: mode });

  return <div ref={chartRef} className="chart-container" />;
};

export default CoreEntryChart;
