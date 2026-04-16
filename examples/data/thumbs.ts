import type { EChartsOption } from "echarts";

const baseGrid = { top: 14, bottom: 14, left: 28, right: 14 };

const stripAxes = (option: EChartsOption): EChartsOption => ({
  ...option,
  backgroundColor: "transparent",
  title: undefined,
  legend: undefined,
  tooltip: undefined,
  grid: baseGrid,
  animation: false,
});

export const thumbOptions: Record<string, EChartsOption> = {
  bar: stripAxes({
    xAxis: { type: "category", data: ["M", "T", "W", "T", "F", "S", "S"] },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: [23, 24, 18, 25, 27, 28, 25], itemStyle: { borderRadius: 2 } }],
  }),
  line: stripAxes({
    xAxis: { type: "category", data: ["M", "T", "W", "T", "F", "S", "S"] },
    yAxis: { type: "value" },
    series: [
      {
        type: "line",
        smooth: true,
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        showSymbol: false,
        areaStyle: { opacity: 0.2 },
      },
    ],
  }),
  radar: {
    backgroundColor: "transparent",
    animation: false,
    radar: {
      center: ["50%", "50%"],
      radius: "62%",
      indicator: [
        { name: "FE", max: 100 },
        { name: "BE", max: 100 },
        { name: "Ops", max: 100 },
        { name: "UX", max: 100 },
        { name: "QA", max: 100 },
      ],
      splitNumber: 3,
      axisName: { fontSize: 9 },
    },
    series: [
      {
        type: "radar",
        data: [{ value: [85, 65, 55, 80, 72] }, { value: [60, 88, 84, 45, 78] }],
        areaStyle: { opacity: 0.15 },
      },
    ],
  },
  gauge: {
    backgroundColor: "transparent",
    animation: false,
    series: [
      {
        type: "gauge",
        center: ["50%", "62%"],
        radius: "90%",
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        progress: { show: true, width: 8 },
        axisLine: { lineStyle: { width: 8 } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { length: "55%", width: 3 },
        detail: { valueAnimation: false, fontSize: 16, offsetCenter: [0, "40%"] },
        data: [{ value: 72 }],
      },
    ],
  },
  candlestick: stripAxes({
    xAxis: { type: "category", data: ["1", "2", "3", "4", "5", "6", "7", "8"] },
    yAxis: { type: "value", scale: true },
    series: [
      {
        type: "candlestick",
        data: [
          [116, 129, 112, 132],
          [128, 133, 126, 136],
          [132, 127, 124, 134],
          [128, 136, 126, 140],
          [135, 131, 128, 138],
          [130, 142, 128, 145],
          [141, 138, 134, 144],
          [137, 145, 135, 148],
        ],
      },
    ],
  }),
  heatmap: stripAxes({
    xAxis: { type: "category", data: ["1", "2", "3", "4", "5", "6", "7"], show: false },
    yAxis: { type: "category", data: ["A", "B", "C", "D"], show: false },
    series: [
      {
        type: "heatmap",
        data: Array.from({ length: 28 }, (_, i) => [
          i % 7,
          Math.floor(i / 7),
          Math.floor(Math.random() * 10),
        ]) as [number, number, number][],
      },
    ],
    visualMap: { min: 0, max: 10, show: false, inRange: { color: ["#eef", "#46c"] } },
  }),
  funnel: {
    backgroundColor: "transparent",
    animation: false,
    series: [
      {
        type: "funnel",
        left: "10%",
        top: 8,
        bottom: 8,
        width: "80%",
        sort: "descending",
        gap: 1,
        label: { show: false },
        data: [
          { value: 100, name: "V" },
          { value: 72, name: "C" },
          { value: 48, name: "S" },
          { value: 28, name: "T" },
          { value: 12, name: "P" },
        ],
      },
    ],
  },
  treemap: {
    backgroundColor: "transparent",
    animation: false,
    series: [
      {
        type: "treemap",
        roam: false,
        breadcrumb: { show: false },
        top: 4,
        bottom: 4,
        left: 4,
        right: 4,
        label: { show: false },
        data: [
          { name: "A", value: 120 },
          { name: "B", value: 90 },
          { name: "C", value: 60 },
          { name: "D", value: 40 },
          { name: "E", value: 25 },
        ],
      },
    ],
  },
};
