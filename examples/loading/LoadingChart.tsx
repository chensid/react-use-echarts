import React, { useRef, useState } from "react";
import { useEcharts } from "../../src";
import type { EChartsOption } from "echarts";

const LoadingChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  const option: EChartsOption = {
    title: { text: "Loading State Demo" },
    tooltip: {},
    xAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"] },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: [300, 450, 380, 520] }],
  };

  useEcharts(chartRef, {
    option,
    showLoading: loading,
    loadingOption: { text: "Loading data..." },
  });

  return (
    <div>
      <button onClick={() => setLoading((prev) => !prev)} style={{ marginBottom: "8px" }}>
        {loading ? "Hide Loading" : "Show Loading"}
      </button>
      <div ref={chartRef} style={{ width: "100%", height: "400px" }} />
    </div>
  );
};

export default LoadingChart;
