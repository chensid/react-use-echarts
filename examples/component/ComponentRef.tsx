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
      <div className="controls">
        <button type="button" className="btn" onClick={handleUpdate}>
          Randomize Data
        </button>
        <button type="button" className="btn" onClick={handleResize}>
          Manual Resize
        </button>
      </div>
      <EChart ref={chartRef} option={option} style={{ height: "340px", width: "100%" }} />
    </div>
  );
};

export default ComponentRef;
