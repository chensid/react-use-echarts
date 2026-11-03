import React from "react";
import ReactDOM from "react-dom/client";
import * as echarts from "echarts/core";
import { LabelLayout, UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import { registerBuiltinThemes } from "react-use-echarts/themes/registry";
import App from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import "./global.css";

// App-wide ECharts setup only: the default renderer and shared features. Every
// demo (and the hero, thumbnails and playground) registers the series and
// components it renders next to its own code, so its source lists each module it
// needs; `echarts.use()` is idempotent. RendererToggle registers SVGRenderer.
echarts.use([CanvasRenderer, LabelLayout, UniversalTransition]);

registerBuiltinThemes();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
