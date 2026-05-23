/**
 * Demonstrates selective ECharts registration as an alternative to the
 * all-in-one `registerEchartsFull()` sugar from
 * `react-use-echarts/preset-full`.
 *
 * Since v2.1 the library is fully modular: neither the default
 * `react-use-echarts` entry nor the (now deprecated) `/core` alias auto-
 * registers any chart/component. Production apps that only render a handful
 * of chart types can skip `registerEchartsFull()` and instead call
 * `echarts.use([...])` with just the modules they need — bundlers then
 * tree-shake the rest of ECharts away.
 *
 * Note: inside this example app the gallery routes already pull in the full
 * ECharts surface via `examples/main.tsx`'s `registerEchartsFull()` call, so
 * this demo's slimmer registration list does not actually shrink the bundle
 * here. The tree-shaking benefit is realized in a standalone consumer
 * project that omits `registerEchartsFull()` entirely.
 */
import React from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, TitleComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useEcharts } from "../../src";
import { useTheme } from "../components/theme-context";
import type { EChartsOption } from "echarts";

// Register only the pieces this chart needs. ECharts maintains a single
// global registry, so `use()` calls compose across modules in the consumer
// application.
echarts.use([LineChart, GridComponent, TooltipComponent, TitleComponent, CanvasRenderer]);

const CoreEntryChart: React.FC = () => {
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

  const { ref } = useEcharts({ option: options, theme: mode });

  return <div ref={ref} className="chart-container" />;
};

export default CoreEntryChart;
