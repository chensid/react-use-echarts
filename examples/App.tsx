import React, { useEffect, useMemo, useState } from "react";
import BarChart from "./basic/BarChart";
import LineChart from "./basic/LineChart";
import ComponentRef from "./component/ComponentRef";
import DynamicChart from "./dynamic/DynamicChart";
import EventChart from "./events/EventChart";
import CandlestickChart from "./gallery/CandlestickChart";
import FunnelChart from "./gallery/FunnelChart";
import GaugeChart from "./gallery/GaugeChart";
import HeatmapChart from "./gallery/HeatmapChart";
import RadarChart from "./gallery/RadarChart";
import TreemapChart from "./gallery/TreemapChart";
import LazyCharts from "./lazy/LazyCharts";
import LinkedCharts from "./linkage/LinkedCharts";
import LoadingChart from "./loading/LoadingChart";
import RendererToggle from "./renderer/RendererToggle";
import ThemeSwitcher from "./themes/ThemeSwitcher";
import DemoCard from "./components/DemoCard";
import DemoSection from "./components/DemoSection";
import Footer from "./components/Footer";
import Header from "./components/Header";
import type { ThemeMode } from "./components/Header";
import Hero from "./components/Hero";
import Sidebar, { type NavSection } from "./components/Sidebar";
import styles from "./app.module.css";

import BarChartRaw from "./basic/BarChart.tsx?raw";
import LineChartRaw from "./basic/LineChart.tsx?raw";
import ComponentRefRaw from "./component/ComponentRef.tsx?raw";
import DynamicChartRaw from "./dynamic/DynamicChart.tsx?raw";
import EventChartRaw from "./events/EventChart.tsx?raw";
import CandlestickChartRaw from "./gallery/CandlestickChart.tsx?raw";
import FunnelChartRaw from "./gallery/FunnelChart.tsx?raw";
import GaugeChartRaw from "./gallery/GaugeChart.tsx?raw";
import HeatmapChartRaw from "./gallery/HeatmapChart.tsx?raw";
import RadarChartRaw from "./gallery/RadarChart.tsx?raw";
import TreemapChartRaw from "./gallery/TreemapChart.tsx?raw";
import LazyChartsRaw from "./lazy/LazyCharts.tsx?raw";
import LinkedChartsRaw from "./linkage/LinkedCharts.tsx?raw";
import LoadingChartRaw from "./loading/LoadingChart.tsx?raw";
import RendererToggleRaw from "./renderer/RendererToggle.tsx?raw";
import ThemeSwitcherRaw from "./themes/ThemeSwitcher.tsx?raw";

const fixImports = (src: string) =>
  src.replace(/from ["']\.\.\/\.\.\/src["']/g, 'from "react-use-echarts"');

const BarChartSource = fixImports(BarChartRaw);
const LineChartSource = fixImports(LineChartRaw);
const ComponentRefSource = fixImports(ComponentRefRaw);
const DynamicChartSource = fixImports(DynamicChartRaw);
const EventChartSource = fixImports(EventChartRaw);
const CandlestickChartSource = fixImports(CandlestickChartRaw);
const FunnelChartSource = fixImports(FunnelChartRaw);
const GaugeChartSource = fixImports(GaugeChartRaw);
const HeatmapChartSource = fixImports(HeatmapChartRaw);
const RadarChartSource = fixImports(RadarChartRaw);
const TreemapChartSource = fixImports(TreemapChartRaw);
const LazyChartsSource = fixImports(LazyChartsRaw);
const LinkedChartsSource = fixImports(LinkedChartsRaw);
const LoadingChartSource = fixImports(LoadingChartRaw);
const RendererToggleSource = fixImports(RendererToggleRaw);
const ThemeSwitcherSource = fixImports(ThemeSwitcherRaw);

const STORAGE_KEY = "rce-theme";

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "dark" || v === "light") return v;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const sections: readonly (NavSection & { description: string })[] = [
  {
    id: "basic",
    title: "Basic Usage",
    description: "Line and bar charts with auto resize and reactive options.",
  },
  {
    id: "gallery",
    title: "Gallery",
    description:
      "Diverse chart types powered by ECharts — radar, gauge, K-line, heatmap, and more.",
  },
  {
    id: "dynamic",
    title: "Dynamic Data",
    description: "Real-time data updates via setOption for live monitoring scenarios.",
  },
  {
    id: "themes",
    title: "Themes",
    description: "Switch between built-in and custom themes at runtime.",
  },
  {
    id: "renderer",
    title: "Renderer",
    description: "Canvas vs SVG — choose the right renderer for your use case.",
  },
  {
    id: "linkage",
    title: "Chart Linkage",
    description: "Shared group for synchronized tooltip interactions.",
  },
  {
    id: "events",
    title: "Events",
    description: "Shorthand and full event config for click and hover.",
  },
  {
    id: "loading",
    title: "Loading",
    description: "Dynamic loading overlays with showLoading toggle.",
  },
  {
    id: "component",
    title: "Component",
    description: "Declarative API with imperative ref methods.",
  },
  {
    id: "lazy",
    title: "Lazy Init",
    description: "IntersectionObserver defers chart creation until visible.",
  },
];

const App: React.FC = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navSections = useMemo<readonly NavSection[]>(
    () => sections.map(({ id, title }) => ({ id, title })),
    [],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = themeMode;
    window.localStorage.setItem(STORAGE_KEY, themeMode);
  }, [themeMode]);

  return (
    <div>
      <Header
        themeMode={themeMode}
        onThemeToggle={() => setThemeMode((p) => (p === "dark" ? "light" : "dark"))}
        onSidebarToggle={() => setSidebarOpen((p) => !p)}
      />

      <div className={styles.layout}>
        <Sidebar
          sections={navSections}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className={styles.main} onClick={() => setSidebarOpen(false)}>
          <div className={styles.inner}>
            <Hero />

            <DemoSection id="basic" title="Basic Usage" description={sections[0].description}>
              <DemoCard
                title="Bar Chart"
                description="Minimal hook usage."
                sourceCode={BarChartSource}
                sourcePath="examples/basic/BarChart.tsx"
                themeMode={themeMode}
              >
                <BarChart />
              </DemoCard>
              <DemoCard
                title="Line Chart"
                description="Smooth curves with explicit theme."
                sourceCode={LineChartSource}
                sourcePath="examples/basic/LineChart.tsx"
                themeMode={themeMode}
              >
                <LineChart />
              </DemoCard>
            </DemoSection>

            <DemoSection id="gallery" title="Gallery" description={sections[1].description}>
              <div className="grid-2">
                <DemoCard
                  title="Radar"
                  description="Multi-dimensional comparison."
                  sourceCode={RadarChartSource}
                  sourcePath="examples/gallery/RadarChart.tsx"
                  themeMode={themeMode}
                >
                  <RadarChart />
                </DemoCard>
                <DemoCard
                  title="Gauge"
                  description="Single-value indicator."
                  sourceCode={GaugeChartSource}
                  sourcePath="examples/gallery/GaugeChart.tsx"
                  themeMode={themeMode}
                >
                  <GaugeChart />
                </DemoCard>
              </div>
              <div className="grid-2">
                <DemoCard
                  title="Candlestick"
                  description="Financial OHLC data."
                  sourceCode={CandlestickChartSource}
                  sourcePath="examples/gallery/CandlestickChart.tsx"
                  themeMode={themeMode}
                >
                  <CandlestickChart />
                </DemoCard>
                <DemoCard
                  title="Heatmap"
                  description="Matrix density visualization."
                  sourceCode={HeatmapChartSource}
                  sourcePath="examples/gallery/HeatmapChart.tsx"
                  themeMode={themeMode}
                >
                  <HeatmapChart />
                </DemoCard>
              </div>
              <div className="grid-2">
                <DemoCard
                  title="Funnel"
                  description="Conversion funnel analysis."
                  sourceCode={FunnelChartSource}
                  sourcePath="examples/gallery/FunnelChart.tsx"
                  themeMode={themeMode}
                >
                  <FunnelChart />
                </DemoCard>
                <DemoCard
                  title="Treemap"
                  description="Hierarchical data proportions."
                  sourceCode={TreemapChartSource}
                  sourcePath="examples/gallery/TreemapChart.tsx"
                  themeMode={themeMode}
                >
                  <TreemapChart />
                </DemoCard>
              </div>
            </DemoSection>

            <DemoSection id="dynamic" title="Dynamic Data" description={sections[2].description}>
              <DemoCard
                title="Real-time Monitor"
                description="Live data stream with setOption."
                sourceCode={DynamicChartSource}
                sourcePath="examples/dynamic/DynamicChart.tsx"
                themeMode={themeMode}
              >
                <DynamicChart />
              </DemoCard>
            </DemoSection>

            <DemoSection id="themes" title="Themes" description={sections[3].description}>
              <DemoCard
                title="Theme Switcher"
                sourceCode={ThemeSwitcherSource}
                sourcePath="examples/themes/ThemeSwitcher.tsx"
                themeMode={themeMode}
              >
                <ThemeSwitcher />
              </DemoCard>
            </DemoSection>

            <DemoSection id="renderer" title="Renderer" description={sections[4].description}>
              <DemoCard
                title="Canvas vs SVG"
                sourceCode={RendererToggleSource}
                sourcePath="examples/renderer/RendererToggle.tsx"
                themeMode={themeMode}
              >
                <RendererToggle />
              </DemoCard>
            </DemoSection>

            <DemoSection id="linkage" title="Chart Linkage" description={sections[5].description}>
              <DemoCard
                title="Linked Charts"
                description="Same group syncs tooltips."
                sourceCode={LinkedChartsSource}
                sourcePath="examples/linkage/LinkedCharts.tsx"
                themeMode={themeMode}
              >
                <LinkedCharts />
              </DemoCard>
            </DemoSection>

            <DemoSection id="events" title="Events" description={sections[6].description}>
              <DemoCard
                title="Click + Hover"
                sourceCode={EventChartSource}
                sourcePath="examples/events/EventChart.tsx"
                themeMode={themeMode}
              >
                <EventChart />
              </DemoCard>
            </DemoSection>

            <DemoSection id="loading" title="Loading" description={sections[7].description}>
              <DemoCard
                title="Toggle Loading"
                sourceCode={LoadingChartSource}
                sourcePath="examples/loading/LoadingChart.tsx"
                themeMode={themeMode}
              >
                <LoadingChart />
              </DemoCard>
            </DemoSection>

            <DemoSection id="component" title="Component" description={sections[8].description}>
              <DemoCard
                title="Component + Ref"
                description="Imperative setOption and resize."
                sourceCode={ComponentRefSource}
                sourcePath="examples/component/ComponentRef.tsx"
                themeMode={themeMode}
              >
                <ComponentRef />
              </DemoCard>
            </DemoSection>

            <DemoSection id="lazy" title="Lazy Init" description={sections[9].description}>
              <DemoCard
                title="Lazy Charts"
                description="Scroll to init."
                sourceCode={LazyChartsSource}
                sourcePath="examples/lazy/LazyCharts.tsx"
                themeMode={themeMode}
              >
                <LazyCharts />
              </DemoCard>
            </DemoSection>

            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
