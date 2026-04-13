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
      <button type="button" className="btn" onClick={() => setLoading((prev) => !prev)}>
        {loading ? "Hide Loading" : "Show Loading"}
      </button>
      <div ref={chartRef} className="chart-container" style={{ marginTop: 10 }} />
    </div>
  );
};

export default LoadingChart;
