import React, { useRef } from "react";
import { EChart } from "../../src";
import type { UseEchartsReturn } from "../../src";
import type { EChartsOption } from "echarts";

const ComponentRef: React.FC = () => {
  const chartRef = useRef<UseEchartsReturn>(null);

  const option: EChartsOption = {
    backgroundColor: "transparent",
    title: { text: "Traffic Sources", left: "center" },
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: ["40%", "65%"],
        label: { show: true, formatter: "{b}: {d}%" },
        data: [
          { value: 1048, name: "Search" },
          { value: 735, name: "Direct" },
          { value: 580, name: "Email" },
          { value: 484, name: "Social" },
          { value: 300, name: "Referral" },
        ],
      },
    ],
  };

  const handleUpdate = () => {
    chartRef.current?.setOption({
      series: [
        {
          data: [
            { value: Math.floor(Math.random() * 1000) + 200, name: "Search" },
            { value: Math.floor(Math.random() * 800) + 200, name: "Direct" },
            { value: Math.floor(Math.random() * 600) + 200, name: "Email" },
            { value: Math.floor(Math.random() * 500) + 200, name: "Social" },
            { value: Math.floor(Math.random() * 400) + 200, name: "Referral" },
          ],
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
