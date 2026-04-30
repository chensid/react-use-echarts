import React, { useRef, useState } from "react";
import { EChart } from "../../src";
import type { UseEchartsReturn } from "../../src";
import { useTheme } from "../components/theme-context";
import type { EChartsOption } from "echarts";

const baseOption: EChartsOption = {
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

const ComponentRef: React.FC = () => {
  const chartRef = useRef<UseEchartsReturn>(null);
  const { mode } = useTheme();
  const [highlighted, setHighlighted] = useState(false);
  const [cleared, setCleared] = useState(false);

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

  const handleToggleHighlight = () => {
    chartRef.current?.dispatchAction({
      type: highlighted ? "downplay" : "highlight",
      seriesIndex: 0,
      dataIndex: 0,
    });
    setHighlighted((v) => !v);
  };

  const handleClear = () => {
    chartRef.current?.clear();
    setHighlighted(false);
    setCleared(true);
  };

  const handleReset = () => {
    chartRef.current?.setOption(baseOption, { notMerge: true });
    setCleared(false);
  };

  const handleResize = () => {
    chartRef.current?.resize();
  };

  return (
    <div>
      <div className="controls">
        <button type="button" className="btn" onClick={handleUpdate} disabled={cleared}>
          Randomize Data
        </button>
        <button type="button" className="btn" onClick={handleToggleHighlight} disabled={cleared}>
          {highlighted ? "Downplay" : "Highlight Top"}
        </button>
        <button type="button" className="btn" onClick={handleClear} disabled={cleared}>
          Clear
        </button>
        <button type="button" className="btn" onClick={handleReset} disabled={!cleared}>
          Reset
        </button>
        <button type="button" className="btn" onClick={handleResize}>
          Manual Resize
        </button>
      </div>
      <EChart
        ref={chartRef}
        option={baseOption}
        theme={mode}
        style={{ height: "340px", width: "100%" }}
      />
    </div>
  );
};

export default ComponentRef;
