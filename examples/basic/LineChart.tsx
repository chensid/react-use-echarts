import React from "react";
import { useEcharts } from "../../src";
import type { EChartsOption } from "echarts";

const LineChart: React.FC = () => {
  const options: EChartsOption = {
    title: { text: "Basic Line Chart Example" },
    xAxis: {
      type: "category",
      data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: "line",
        smooth: true,
      },
    ],
  };

  const { chartRef } = useEcharts({ option: options });

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
};

export default LineChart;
