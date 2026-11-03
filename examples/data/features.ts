import React from "react";
import type { IconName } from "../components/Icon";
import type { DemoItem } from "./types";

export interface FeatureItem extends DemoItem {
  readonly icon: IconName;
}

export const featureItems: readonly FeatureItem[] = [
  {
    id: "dynamic",
    title: "Dynamic Data",
    description: "Real-time data updates via setOption for live monitoring.",
    icon: "activity",
    component: React.lazy(() => import("../features/DynamicChart")),
    source: () => import("../features/DynamicChart.tsx?raw"),
    sourcePath: "examples/features/DynamicChart.tsx",
  },
  {
    id: "themes",
    title: "Themes",
    description: "Switch between built-in and custom themes at runtime.",
    icon: "palette",
    component: React.lazy(() => import("../features/ThemeSwitcher")),
    source: () => import("../features/ThemeSwitcher.tsx?raw"),
    sourcePath: "examples/features/ThemeSwitcher.tsx",
  },
  {
    id: "renderer",
    title: "Renderer",
    description: "Canvas vs SVG — choose the right renderer.",
    icon: "layers",
    component: React.lazy(() => import("../features/RendererToggle")),
    source: () => import("../features/RendererToggle.tsx?raw"),
    sourcePath: "examples/features/RendererToggle.tsx",
  },
  {
    id: "linkage",
    title: "Chart Linkage",
    description: "Shared group for synchronized tooltip interactions.",
    icon: "link",
    component: React.lazy(() => import("../features/LinkedCharts")),
    source: () => import("../features/LinkedCharts.tsx?raw"),
    sourcePath: "examples/features/LinkedCharts.tsx",
  },
  {
    id: "events",
    title: "Events",
    description: "Inline click and hover handlers — shorthand or full config, no memoization.",
    icon: "mouse",
    component: React.lazy(() => import("../features/EventChart")),
    source: () => import("../features/EventChart.tsx?raw"),
    sourcePath: "examples/features/EventChart.tsx",
  },
  {
    id: "loading",
    title: "Loading",
    description: "Dynamic loading overlays with showLoading toggle.",
    icon: "spinner",
    component: React.lazy(() => import("../features/LoadingChart")),
    source: () => import("../features/LoadingChart.tsx?raw"),
    sourcePath: "examples/features/LoadingChart.tsx",
  },
  {
    id: "component",
    title: "Component + Ref",
    description: "Declarative API with imperative ref methods.",
    icon: "cube",
    component: React.lazy(() => import("../features/ComponentRef")),
    source: () => import("../features/ComponentRef.tsx?raw"),
    sourcePath: "examples/features/ComponentRef.tsx",
  },
  {
    id: "imperative-export",
    title: "Export & Stream",
    description: "Download PNG via getDataURL; grow data via appendData.",
    icon: "copy",
    component: React.lazy(() => import("../features/ExportStream")),
    source: () => import("../features/ExportStream.tsx?raw"),
    sourcePath: "examples/features/ExportStream.tsx",
  },
  {
    id: "lazy",
    title: "Lazy Init",
    description: "IntersectionObserver defers chart creation until visible.",
    icon: "eye",
    component: React.lazy(() => import("../features/LazyCharts")),
    source: () => import("../features/LazyCharts.tsx?raw"),
    sourcePath: "examples/features/LazyCharts.tsx",
  },
  {
    id: "error",
    title: "Error Handling",
    description: "Catch chart errors gracefully via the onError callback.",
    icon: "alert",
    component: React.lazy(() => import("../features/OnErrorDemo")),
    source: () => import("../features/OnErrorDemo.tsx?raw"),
    sourcePath: "examples/features/OnErrorDemo.tsx",
  },
  {
    id: "selective-registration",
    title: "Selective Registration",
    description:
      "Register only the chart/component/renderer modules you actually render via echarts.use([...]) — tree-shake-friendly alternative to registerEchartsFull().",
    icon: "layers",
    component: React.lazy(() => import("../features/SelectiveRegistrationChart")),
    source: () => import("../features/SelectiveRegistrationChart.tsx?raw"),
    sourcePath: "examples/features/SelectiveRegistrationChart.tsx",
  },
];

export const findFeatureItem = (id: string | undefined): FeatureItem | undefined =>
  featureItems.find((i) => i.id === id);
