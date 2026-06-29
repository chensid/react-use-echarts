import React, { useState } from "react";
import { useEcharts, type EChartsOption } from "../../src";
import { useTheme } from "../components/theme-context";

const LoadingChart: React.FC = () => {
  const { mode } = useTheme();
  const [loading, setLoading] = useState(true);

  const option: EChartsOption = {
    backgroundColor: "transparent",
    title: { text: "Quarterly Revenue" },
    tooltip: {},
    xAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"] },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: [300, 450, 380, 520] }],
  };

  const { ref } = useEcharts({
    option,
    theme: mode,
    showLoading: loading,
    loadingOption: { text: "Loading data..." },
  });

  return (
    <div>
      <button type="button" className="btn" onClick={() => setLoading((prev) => !prev)}>
        {loading ? "Hide Loading" : "Show Loading"}
      </button>
      <div ref={ref} className="chart-container" style={{ marginTop: 10 }} />
    </div>
  );
};

export default LoadingChart;
