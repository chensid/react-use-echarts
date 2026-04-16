import React, { useRef } from "react";
import { useEcharts } from "../../src";
import { useTheme } from "../components/theme-context";
import type { EChartsOption } from "echarts";

const sharedOption: EChartsOption = {
  backgroundColor: "transparent",
  tooltip: { trigger: "axis" },
  xAxis: { type: "category", data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
  yAxis: { type: "value" },
  series: [
    { name: "Revenue", type: "bar", data: [85, 120, 95, 140, 110, 130] },
    { name: "Profit", type: "line", smooth: true, data: [30, 55, 40, 70, 50, 65] },
  ],
  legend: { bottom: 0 },
  grid: { top: 40, bottom: 40, left: 45, right: 20 },
};

const RendererToggle: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const { mode } = useTheme();

  const canvasOption: EChartsOption = {
    ...sharedOption,
    title: { text: "Canvas Renderer", textStyle: { fontSize: 14 } },
  };

  const svgOption: EChartsOption = {
    ...sharedOption,
    title: { text: "SVG Renderer", textStyle: { fontSize: 14 } },
  };

  useEcharts(canvasRef, { option: canvasOption, renderer: "canvas", theme: mode });
  useEcharts(svgRef, { option: svgOption, renderer: "svg", theme: mode });

  return (
    <div>
      <div className="note-box" style={{ marginBottom: 10 }}>
        Canvas excels with large datasets; SVG is better for small charts that need crisp scaling
        and CSS styling.
      </div>
      <div className="grid-2">
        <div ref={canvasRef} className="chart-container-sm" />
        <div ref={svgRef} className="chart-container-sm" />
      </div>
    </div>
  );
};

export default RendererToggle;
