import { demoModule } from "./demo-modules";
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
    ...demoModule("features/DynamicChart.tsx"),
  },
  {
    id: "themes",
    title: "Themes",
    description: "Switch between built-in and custom themes at runtime.",
    icon: "palette",
    ...demoModule("features/ThemeSwitcher.tsx"),
  },
  {
    id: "renderer",
    title: "Renderer",
    description: "Canvas vs SVG — choose the right renderer.",
    icon: "layers",
    ...demoModule("features/RendererToggle.tsx"),
  },
  {
    id: "linkage",
    title: "Chart Linkage",
    description: "Shared group for synchronized tooltip interactions.",
    icon: "link",
    ...demoModule("features/LinkedCharts.tsx"),
  },
  {
    id: "events",
    title: "Events",
    description: "Inline click and hover handlers — shorthand or full config, no memoization.",
    icon: "mouse",
    ...demoModule("features/EventChart.tsx"),
  },
  {
    id: "loading",
    title: "Loading",
    description: "Dynamic loading overlays with showLoading toggle.",
    icon: "spinner",
    ...demoModule("features/LoadingChart.tsx"),
  },
  {
    id: "component",
    title: "Component + Ref",
    description: "Declarative API with imperative ref methods.",
    icon: "cube",
    ...demoModule("features/ComponentRef.tsx"),
  },
  {
    id: "imperative-export",
    title: "Export & Stream",
    description: "Download PNG via getDataURL; grow data via appendData.",
    icon: "copy",
    ...demoModule("features/ExportStream.tsx"),
  },
  {
    id: "lazy",
    title: "Lazy Init",
    description: "IntersectionObserver defers chart creation until visible.",
    icon: "eye",
    ...demoModule("features/LazyCharts.tsx"),
  },
  {
    id: "error",
    title: "Error Handling",
    description: "Catch chart errors gracefully via the onError callback.",
    icon: "alert",
    ...demoModule("features/OnErrorDemo.tsx"),
  },
  {
    id: "selective-registration",
    title: "Selective Registration",
    description:
      "Register only the chart/component/renderer modules you actually render via echarts.use([...]) — tree-shake-friendly alternative to registerEchartsFull().",
    icon: "layers",
    ...demoModule("features/SelectiveRegistrationChart.tsx"),
  },
];

export const findFeatureItem = (id: string | undefined): FeatureItem | undefined =>
  featureItems.find((i) => i.id === id);
