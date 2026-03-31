import React, { useRef } from "react";
import { EChart } from "../../src";
import type { UseEchartsReturn } from "../../src";
import type { EChartsOption } from "echarts";

const ComponentRef: React.FC = () => {
  const chartRef = useRef<UseEchartsReturn>(null);

  const option: EChartsOption = {
    title: { text: "EChart Component with Ref" },
    tooltip: {},
    xAxis: { type: "category", data: ["A", "B", "C", "D", "E"] },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: [40, 60, 80, 50, 70] }],
  };

  const handleUpdate = () => {
    chartRef.current?.setOption({
      series: [
        {
          data: Array.from({ length: 5 }, () => Math.floor(Math.random() * 100)),
        },
      ],
    });
  };

  const handleResize = () => {
    chartRef.current?.resize();
  };

  return (
    <div>
      <div style={{ marginBottom: "8px" }}>
        <button onClick={handleUpdate} style={{ marginRight: "8px" }}>
          Randomize Data
        </button>
        <button onClick={handleResize}>Manual Resize</button>
      </div>
      <EChart ref={chartRef} option={option} style={{ height: "400px" }} />
    </div>
  );
};

export default ComponentRef;
