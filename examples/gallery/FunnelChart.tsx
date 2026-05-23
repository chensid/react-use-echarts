import React from "react";
import { useEcharts } from "../../src";
import { useTheme } from "../components/theme-context";
import type { EChartsOption } from "echarts";

const FunnelChart: React.FC = () => {
  const { mode } = useTheme();

  const option: EChartsOption = {
    backgroundColor: "transparent",
    title: { text: "Conversion Funnel", left: "center" },
    tooltip: { trigger: "item", formatter: "{b}: {c}%" },
    series: [
      {
        type: "funnel",
        left: "10%",
        top: 50,
        bottom: 10,
        width: "80%",
        sort: "descending",
        gap: 2,
        label: { show: true, position: "inside", formatter: "{b}\n{c}%" },
        emphasis: { label: { fontSize: 16 } },
        data: [
          { value: 100, name: "Visitors" },
          { value: 72, name: "Clicked" },
          { value: 48, name: "Sign Up" },
          { value: 28, name: "Trial" },
          { value: 12, name: "Purchase" },
        ],
      },
    ],
  };

  const { ref } = useEcharts({ option, theme: mode });

  return <div ref={ref} className="chart-container-sm" />;
};

export default FunnelChart;
