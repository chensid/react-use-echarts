import React from "react";
import type { DemoItem } from "./types";

export const galleryItems: readonly DemoItem[] = [
  {
    id: "bar",
    title: "Bar",
    description: "Weekly sales with basic bars.",
    component: React.lazy(() => import("../basic/BarChart")),
    source: () => import("../basic/BarChart.tsx?raw"),
    sourcePath: "examples/basic/BarChart.tsx",
  },
  {
    id: "line",
    title: "Line",
    description: "Smooth trend line.",
    component: React.lazy(() => import("../basic/LineChart")),
    source: () => import("../basic/LineChart.tsx?raw"),
    sourcePath: "examples/basic/LineChart.tsx",
  },
  {
    id: "radar",
    title: "Radar",
    description: "Multi-dimensional comparison.",
    component: React.lazy(() => import("../gallery/RadarChart")),
    source: () => import("../gallery/RadarChart.tsx?raw"),
    sourcePath: "examples/gallery/RadarChart.tsx",
  },
  {
    id: "gauge",
    title: "Gauge",
    description: "Single-value indicator.",
    component: React.lazy(() => import("../gallery/GaugeChart")),
    source: () => import("../gallery/GaugeChart.tsx?raw"),
    sourcePath: "examples/gallery/GaugeChart.tsx",
  },
  {
    id: "candlestick",
    title: "Candlestick",
    description: "Financial OHLC data.",
    component: React.lazy(() => import("../gallery/CandlestickChart")),
    source: () => import("../gallery/CandlestickChart.tsx?raw"),
    sourcePath: "examples/gallery/CandlestickChart.tsx",
  },
  {
    id: "heatmap",
    title: "Heatmap",
    description: "Matrix density visualization.",
    component: React.lazy(() => import("../gallery/HeatmapChart")),
    source: () => import("../gallery/HeatmapChart.tsx?raw"),
    sourcePath: "examples/gallery/HeatmapChart.tsx",
  },
  {
    id: "funnel",
    title: "Funnel",
    description: "Conversion funnel analysis.",
    component: React.lazy(() => import("../gallery/FunnelChart")),
    source: () => import("../gallery/FunnelChart.tsx?raw"),
    sourcePath: "examples/gallery/FunnelChart.tsx",
  },
  {
    id: "treemap",
    title: "Treemap",
    description: "Hierarchical data proportions.",
    component: React.lazy(() => import("../gallery/TreemapChart")),
    source: () => import("../gallery/TreemapChart.tsx?raw"),
    sourcePath: "examples/gallery/TreemapChart.tsx",
  },
];

export const findGalleryItem = (id: string | undefined): DemoItem | undefined =>
  galleryItems.find((i) => i.id === id);
