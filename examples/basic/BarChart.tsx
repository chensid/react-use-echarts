import React from "react";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import { GridComponent, TitleComponent, TooltipComponent } from "echarts/components";
import { useEcharts, type EChartsOption } from "react-use-echarts";
import { useTheme } from "../components/theme-context";

echarts.use([BarChart, GridComponent, TitleComponent, TooltipComponent]);

const BarChartDemo: React.FC = () => {
  const { mode } = useTheme();

  const options: EChartsOption = {
    backgroundColor: "transparent",
    title: { text: "Weekly Sales" },
    tooltip: {},
    xAxis: { data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    yAxis: {},
    series: [{ name: "Sales", type: "bar", data: [23, 24, 18, 25, 27, 28, 25] }],
  };

  const { ref } = useEcharts({ option: options, theme: mode });

  return <div ref={ref} className="chart-container" />;
};

export default BarChartDemo;
