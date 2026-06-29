import React from "react";
import { useEcharts, type EChartsOption } from "../../src";
import { useTheme } from "../components/theme-context";

const LineChart: React.FC = () => {
  const { mode } = useTheme();

  const options: EChartsOption = {
    backgroundColor: "transparent",
    title: { text: "Weekly Trend" },
    xAxis: {
      type: "category",
      data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    yAxis: { type: "value" },
    series: [
      {
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: "line",
        smooth: true,
      },
    ],
  };

  const { ref } = useEcharts({ option: options, theme: mode });

  return <div ref={ref} className="chart-container" />;
};

export default LineChart;
