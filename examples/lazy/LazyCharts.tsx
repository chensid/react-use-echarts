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

  return <div ref={chartRef} className="chart-container-sm" />;
}

const LazyCharts: React.FC = () => {
  return (
    <div className="scroll-area">
      <p className="note-box" style={{ marginBottom: 10 }}>
        Scroll down to see charts initialize lazily:
      </p>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <LazyChart index={i} />
        </div>
      ))}
    </div>
  );
};

export default LazyCharts;
