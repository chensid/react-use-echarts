import { demoModule } from "./demo-modules";
import type { DemoItem } from "./types";

// Grouped by how ECharts lays the series out: on a shared x/y grid, around a
// center, or as nested / stacked boxes. GalleryIndex builds its filters from this.
export const GALLERY_CATEGORIES = ["Cartesian", "Radial", "Hierarchy & flow"] as const;
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

export interface GalleryItem extends DemoItem {
  readonly category: GalleryCategory;
}

export const galleryItems: readonly GalleryItem[] = [
  {
    id: "bar",
    category: "Cartesian",
    title: "Bar",
    description: "Weekly sales with basic bars.",
    ...demoModule("gallery/BarChart.tsx"),
  },
  {
    id: "line",
    category: "Cartesian",
    title: "Line",
    description: "Smooth trend line.",
    ...demoModule("gallery/LineChart.tsx"),
  },
  {
    id: "radar",
    category: "Radial",
    title: "Radar",
    description: "Multi-dimensional comparison.",
    ...demoModule("gallery/RadarChart.tsx"),
  },
  {
    id: "gauge",
    category: "Radial",
    title: "Gauge",
    description: "Single-value indicator.",
    ...demoModule("gallery/GaugeChart.tsx"),
  },
  {
    id: "candlestick",
    category: "Cartesian",
    title: "Candlestick",
    description: "Financial OHLC data.",
    ...demoModule("gallery/CandlestickChart.tsx"),
  },
  {
    id: "heatmap",
    category: "Cartesian",
    title: "Heatmap",
    description: "Matrix density visualization.",
    ...demoModule("gallery/HeatmapChart.tsx"),
  },
  {
    id: "funnel",
    category: "Hierarchy & flow",
    title: "Funnel",
    description: "Conversion funnel analysis.",
    ...demoModule("gallery/FunnelChart.tsx"),
  },
  {
    id: "treemap",
    category: "Hierarchy & flow",
    title: "Treemap",
    description: "Hierarchical data proportions.",
    ...demoModule("gallery/TreemapChart.tsx"),
  },
];

export const CHART_COUNT = galleryItems.length;

export const findGalleryItem = (id: string | undefined): GalleryItem | undefined =>
  galleryItems.find((i) => i.id === id);
