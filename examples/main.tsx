import React from "react";
import ReactDOM from "react-dom/client";
import * as echarts from "echarts/core";
import {
  BarChart,
  CandlestickChart,
  FunnelChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
  TreemapChart,
} from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { LabelLayout, UniversalTransition } from "echarts/features";
import { CanvasRenderer, SVGRenderer } from "echarts/renderers";
import { registerBuiltinThemes } from "../src/themes/registry";
import App from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import "./global.css";

// Keep the showcase honest: register exactly the chart/component surface its
// routes render instead of pulling every ECharts module into the initial chunk.
// Consumer apps can trim this list further to match their own screens.
echarts.use([
  BarChart,
  CandlestickChart,
  FunnelChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
  TreemapChart,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
  SVGRenderer,
]);

registerBuiltinThemes();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
