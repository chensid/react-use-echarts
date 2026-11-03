/**
 * Demonstrates selective ECharts registration as an alternative to the
 * all-in-one `registerEchartsFull()` sugar from
 * `react-use-echarts/preset-full`.
 *
 * The library is fully modular: the default `react-use-echarts` entry does not
 * auto-register any chart/component. Production apps that only render a handful
 * of chart types can skip `registerEchartsFull()` and instead call
 * `echarts.use([...])` with just the modules they need — bundlers then
 * tree-shake the rest of ECharts away.
 *
 * Every demo on this site registers its own series and components this way,
 * while `examples/main.tsx` registers the renderer once at app entry. The list
 * below also includes `CanvasRenderer`, so it is the complete set a standalone
 * app needs when it renders only this line chart.
 */
import React from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, TitleComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useEcharts, type EChartsOption } from "react-use-echarts";
import { useTheme } from "../components/theme-context";

// Register only the pieces this chart needs. ECharts maintains a single
// global registry, so `use()` calls compose across modules in the consumer
// application.
echarts.use([LineChart, GridComponent, TooltipComponent, TitleComponent, CanvasRenderer]);

const SelectiveRegistrationChart: React.FC = () => {
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

export default SelectiveRegistrationChart;
