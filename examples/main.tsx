import React from "react";
import ReactDOM from "react-dom/client";
import { registerEchartsFull } from "../src/preset-full";
import { registerBuiltinThemes } from "../src/themes/registry";
import App from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import "./global.css";

// Register the full ECharts surface (charts + components + renderers + features).
// The library itself is modular and does not auto-register anything, so this
// call (or an equivalent selective `echarts.use([...])`) must run before the
// first `useEcharts()` render. See `examples/core-entry/` for a tree-shake-
// friendly alternative that only registers what's actually rendered.
registerEchartsFull();

registerBuiltinThemes();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
