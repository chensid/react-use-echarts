import React, { useRef } from "react";
import { useEcharts } from "../../src";
import type { EChartsOption } from "echarts";

function LazyChart({ index }: { index: number }) {
  const chartRef = useRef<HTMLDivElement>(null);

  const option: EChartsOption = {
    title: { text: `Lazy Chart #${index + 1}` },
    tooltip: {},
    xAxis: { type: "category", data: ["A", "B", "C", "D", "E"] },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: Array.from({ length: 5 }, () => Math.floor(Math.random() * 100)),
      },
    ],
  };

  useEcharts(chartRef, { option, lazyInit: true });

  return <div ref={chartRef} style={{ width: "100%", height: "300px" }} />;
}

const LazyCharts: React.FC = () => {
  return (
    <div style={{ height: "400px", overflow: "auto", border: "1px solid #ddd" }}>
      <p style={{ padding: "8px" }}>Scroll down to see charts initialize lazily:</p>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ marginBottom: "16px" }}>
          <LazyChart index={i} />
        </div>
      ))}
    </div>
  );
};

export default LazyCharts;
