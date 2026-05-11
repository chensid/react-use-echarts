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
    component: React.lazy(() => import("../dynamic/DynamicChart")),
    source: () => import("../dynamic/DynamicChart.tsx?raw"),
    sourcePath: "examples/dynamic/DynamicChart.tsx",
  },
  {
    id: "themes",
    title: "Themes",
    description: "Switch between built-in and custom themes at runtime.",
    icon: "palette",
    component: React.lazy(() => import("../themes/ThemeSwitcher")),
    source: () => import("../themes/ThemeSwitcher.tsx?raw"),
    sourcePath: "examples/themes/ThemeSwitcher.tsx",
  },
  {
    id: "renderer",
    title: "Renderer",
    description: "Canvas vs SVG — choose the right renderer.",
    icon: "layers",
    component: React.lazy(() => import("../renderer/RendererToggle")),
    source: () => import("../renderer/RendererToggle.tsx?raw"),
    sourcePath: "examples/renderer/RendererToggle.tsx",
  },
  {
    id: "linkage",
    title: "Chart Linkage",
    description: "Shared group for synchronized tooltip interactions.",
    icon: "link",
    component: React.lazy(() => import("../linkage/LinkedCharts")),
    source: () => import("../linkage/LinkedCharts.tsx?raw"),
    sourcePath: "examples/linkage/LinkedCharts.tsx",
  },
  {
    id: "events",
    title: "Events",
    description: "Shorthand and full event config for click and hover.",
    icon: "mouse",
    component: React.lazy(() => import("../events/EventChart")),
    source: () => import("../events/EventChart.tsx?raw"),
    sourcePath: "examples/events/EventChart.tsx",
  },
  {
    id: "loading",
    title: "Loading",
    description: "Dynamic loading overlays with showLoading toggle.",
    icon: "spinner",
    component: React.lazy(() => import("../loading/LoadingChart")),
    source: () => import("../loading/LoadingChart.tsx?raw"),
    sourcePath: "examples/loading/LoadingChart.tsx",
  },
  {
    id: "component",
    title: "Component + Ref",
    description: "Declarative API with imperative ref methods.",
    icon: "cube",
    component: React.lazy(() => import("../component/ComponentRef")),
    source: () => import("../component/ComponentRef.tsx?raw"),
    sourcePath: "examples/component/ComponentRef.tsx",
  },
  {
    id: "imperative-export",
    title: "Export & Stream",
    description: "Download PNG via getDataURL; grow data via appendData.",
    icon: "copy",
    component: React.lazy(() => import("../imperative/ExportStream")),
    source: () => import("../imperative/ExportStream.tsx?raw"),
    sourcePath: "examples/imperative/ExportStream.tsx",
  },
  {
    id: "lazy",
    title: "Lazy Init",
    description: "IntersectionObserver defers chart creation until visible.",
    icon: "eye",
    component: React.lazy(() => import("../lazy/LazyCharts")),
    source: () => import("../lazy/LazyCharts.tsx?raw"),
    sourcePath: "examples/lazy/LazyCharts.tsx",
  },
  {
    id: "error",
    title: "Error Handling",
    description: "Catch chart errors gracefully via the onError callback.",
    icon: "alert",
    component: React.lazy(() => import("../error/OnErrorDemo")),
    source: () => import("../error/OnErrorDemo.tsx?raw"),
    sourcePath: "examples/error/OnErrorDemo.tsx",
  },
];

export const findFeatureItem = (id: string | undefined): FeatureItem | undefined =>
  featureItems.find((i) => i.id === id);
