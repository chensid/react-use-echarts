import React from "react";
import ReactDOM from "react-dom/client";
import { registerBuiltinThemes } from "../src/themes/registry";
import App from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import "./global.css";

registerBuiltinThemes();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
