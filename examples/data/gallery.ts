import { demoModule } from "./demo-modules";
import type { DemoItem } from "./types";

export const galleryItems: readonly DemoItem[] = [
  {
    id: "bar",
    title: "Bar",
    description: "Weekly sales with basic bars.",
    ...demoModule("gallery/BarChart.tsx"),
  },
  {
    id: "line",
    title: "Line",
    description: "Smooth trend line.",
    ...demoModule("gallery/LineChart.tsx"),
  },
  {
    id: "radar",
    title: "Radar",
    description: "Multi-dimensional comparison.",
    ...demoModule("gallery/RadarChart.tsx"),
  },
  {
    id: "gauge",
    title: "Gauge",
    description: "Single-value indicator.",
    ...demoModule("gallery/GaugeChart.tsx"),
  },
  {
    id: "candlestick",
    title: "Candlestick",
    description: "Financial OHLC data.",
    ...demoModule("gallery/CandlestickChart.tsx"),
  },
  {
    id: "heatmap",
    title: "Heatmap",
    description: "Matrix density visualization.",
    ...demoModule("gallery/HeatmapChart.tsx"),
  },
  {
    id: "funnel",
    title: "Funnel",
    description: "Conversion funnel analysis.",
    ...demoModule("gallery/FunnelChart.tsx"),
  },
  {
    id: "treemap",
    title: "Treemap",
    description: "Hierarchical data proportions.",
    ...demoModule("gallery/TreemapChart.tsx"),
  },
];

export const CHART_COUNT = galleryItems.length;

export const findGalleryItem = (id: string | undefined): DemoItem | undefined =>
  galleryItems.find((i) => i.id === id);
