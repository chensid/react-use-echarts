import React, { useRef } from "react";
import { useEcharts } from "../../src";
import type { EChartsOption } from "echarts";

const GaugeChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  const option: EChartsOption = {
    backgroundColor: "transparent",
    title: { text: "Server CPU", left: "center" },
    series: [
      {
        type: "gauge",
        startAngle: 220,
        endAngle: -40,
        min: 0,
        max: 100,
        progress: { show: true, width: 14 },
        axisLine: { lineStyle: { width: 14 } },
        axisTick: { show: false },
        splitLine: { length: 8, lineStyle: { width: 2 } },
        axisLabel: { distance: 20, fontSize: 11 },
        pointer: { show: true, length: "55%", width: 5 },
        detail: {
          valueAnimation: true,
          fontSize: 22,
          offsetCenter: [0, "70%"],
          formatter: "{value}%",
        },
        data: [{ value: 72 }],
      },
    ],
  };

  useEcharts(chartRef, { option });

  return <div ref={chartRef} className="chart-container-sm" />;
};

export default GaugeChart;
