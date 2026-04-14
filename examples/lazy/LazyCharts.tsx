import React, { useRef } from "react";
import { useEcharts } from "../../src";
import type { EChartsOption } from "echarts";

const CHART_CONFIGS: (() => EChartsOption)[] = [
  () => ({
    backgroundColor: "transparent",
    title: { text: "Lazy Chart #1 — Bar" },
    tooltip: {},
    xAxis: { type: "category", data: ["A", "B", "C", "D", "E"] },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: randArray(5, 100) }],
  }),
  () => ({
    backgroundColor: "transparent",
    title: { text: "Lazy Chart #2 — Line" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
    yAxis: { type: "value" },
    series: [{ type: "line", smooth: true, data: randArray(5, 80) }],
  }),
  () => ({
    backgroundColor: "transparent",
    title: { text: "Lazy Chart #3 — Pie", left: "center" },
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: "55%",
        data: [
          { value: rand(500), name: "Email" },
          { value: rand(400), name: "Social" },
          { value: rand(300), name: "Direct" },
          { value: rand(200), name: "Search" },
        ],
      },
    ],
  }),
  () => ({
    backgroundColor: "transparent",
    title: { text: "Lazy Chart #4 — Area" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ["Jan", "Feb", "Mar", "Apr", "May"] },
    yAxis: { type: "value" },
    series: [{ type: "line", areaStyle: { opacity: 0.4 }, smooth: true, data: randArray(5, 60) }],
  }),
  () => ({
    backgroundColor: "transparent",
    title: { text: "Lazy Chart #5 — Scatter" },
    tooltip: { trigger: "item" },
    xAxis: { type: "value" },
    yAxis: { type: "value" },
    series: [
      {
        type: "scatter",
        symbolSize: 10,
        data: Array.from({ length: 15 }, () => [rand(100), rand(100)]),
      },
    ],
  }),
  () => ({
    backgroundColor: "transparent",
    title: { text: "Lazy Chart #6 — Bar (horizontal)" },
    tooltip: {},
    xAxis: { type: "value" },
    yAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"] },
    series: [{ type: "bar", data: randArray(4, 120) }],
  }),
  () => ({
    backgroundColor: "transparent",
    title: { text: "Lazy Chart #7 — Stacked Line" },
    tooltip: { trigger: "axis" },
    legend: { bottom: 0 },
    xAxis: { type: "category", data: ["A", "B", "C", "D"] },
    yAxis: { type: "value" },
    series: [
      { name: "Series 1", type: "line", stack: "total", data: randArray(4, 50) },
      { name: "Series 2", type: "line", stack: "total", data: randArray(4, 50) },
    ],
  }),
  () => ({
    backgroundColor: "transparent",
    title: { text: "Lazy Chart #8 — Donut", left: "center" },
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: ["35%", "55%"],
        data: [
          { value: rand(400), name: "Chrome" },
          { value: rand(300), name: "Firefox" },
          { value: rand(200), name: "Safari" },
        ],
      },
    ],
  }),
  () => ({
    backgroundColor: "transparent",
    title: { text: "Lazy Chart #9 — Multi-bar" },
    tooltip: { trigger: "axis" },
    legend: { bottom: 0 },
    xAxis: { type: "category", data: ["Jan", "Feb", "Mar", "Apr"] },
    yAxis: { type: "value" },
    series: [
      { name: "2024", type: "bar", data: randArray(4, 80) },
      { name: "2025", type: "bar", data: randArray(4, 80) },
    ],
  }),
  () => ({
    backgroundColor: "transparent",
    title: { text: "Lazy Chart #10 — Smooth Line" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    yAxis: { type: "value" },
    series: [{ type: "line", smooth: true, data: randArray(7, 90) }],
  }),
];

function rand(max: number) {
  return Math.floor(Math.random() * max) + 10;
}

function randArray(len: number, max: number) {
  return Array.from({ length: len }, () => rand(max));
}

function LazyChart({ index }: { index: number }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const option = CHART_CONFIGS[index]();

  useEcharts(chartRef, { option, lazyInit: true });

  return <div ref={chartRef} className="chart-container-sm" />;
}

const LazyCharts: React.FC = () => {
  return (
    <div className="scroll-area">
      <p className="note-box" style={{ marginBottom: 10 }}>
        Scroll down to see charts initialize lazily:
      </p>
      {CHART_CONFIGS.map((_, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <LazyChart index={i} />
        </div>
      ))}
    </div>
  );
};

export default LazyCharts;
