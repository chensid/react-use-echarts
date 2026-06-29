import React from "react";
import { useEcharts, type EChartsOption } from "../../src";
import { useTheme } from "../components/theme-context";

const BarChart: React.FC = () => {
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

export default BarChart;
