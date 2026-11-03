import React from "react";
import * as echarts from "echarts/core";
import { FunnelChart } from "echarts/charts";
import { TitleComponent, TooltipComponent } from "echarts/components";
import { useEcharts, type EChartsOption } from "react-use-echarts";
import { useTheme } from "../components/theme-context";

echarts.use([FunnelChart, TitleComponent, TooltipComponent]);

const FunnelChartDemo: React.FC = () => {
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

export default FunnelChartDemo;
