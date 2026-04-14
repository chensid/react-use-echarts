import React, { useEffect, useMemo, useState } from "react";
import BarChart from "./basic/BarChart";
import LineChart from "./basic/LineChart";
import ComponentRef from "./component/ComponentRef";
import EventChart from "./events/EventChart";
import LazyCharts from "./lazy/LazyCharts";
import LinkedCharts from "./linkage/LinkedCharts";
import LoadingChart from "./loading/LoadingChart";
import ThemeSwitcher from "./themes/ThemeSwitcher";
import DemoCard from "./components/DemoCard";
import DemoSection from "./components/DemoSection";
import Header from "./components/Header";
import type { ThemeMode } from "./components/Header";
import Sidebar, { type NavSection } from "./components/Sidebar";
import styles from "./app.module.css";

import BarChartRaw from "./basic/BarChart.tsx?raw";
import LineChartRaw from "./basic/LineChart.tsx?raw";
import ComponentRefRaw from "./component/ComponentRef.tsx?raw";
import EventChartRaw from "./events/EventChart.tsx?raw";
import LazyChartsRaw from "./lazy/LazyCharts.tsx?raw";
import LinkedChartsRaw from "./linkage/LinkedCharts.tsx?raw";
import LoadingChartRaw from "./loading/LoadingChart.tsx?raw";
import ThemeSwitcherRaw from "./themes/ThemeSwitcher.tsx?raw";

const fixImports = (src: string) =>
  src.replace(/from ["']\.\.\/\.\.\/src["']/g, 'from "react-use-echarts"');

const BarChartSource = fixImports(BarChartRaw);
const LineChartSource = fixImports(LineChartRaw);
const ComponentRefSource = fixImports(ComponentRefRaw);
const EventChartSource = fixImports(EventChartRaw);
const LazyChartsSource = fixImports(LazyChartsRaw);
const LinkedChartsSource = fixImports(LinkedChartsRaw);
const LoadingChartSource = fixImports(LoadingChartRaw);
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
    id: "themes",
    title: "Themes",
    description: "Switch between built-in and custom themes at runtime.",
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

            <DemoSection id="themes" title="Themes" description={sections[1].description}>
              <DemoCard
                title="Theme Switcher"
                sourceCode={ThemeSwitcherSource}
                sourcePath="examples/themes/ThemeSwitcher.tsx"
                themeMode={themeMode}
              >
                <ThemeSwitcher />
              </DemoCard>
            </DemoSection>

            <DemoSection id="linkage" title="Chart Linkage" description={sections[2].description}>
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

            <DemoSection id="events" title="Events" description={sections[3].description}>
              <DemoCard
                title="Click + Hover"
                sourceCode={EventChartSource}
                sourcePath="examples/events/EventChart.tsx"
                themeMode={themeMode}
              >
                <EventChart />
              </DemoCard>
            </DemoSection>

            <DemoSection id="loading" title="Loading" description={sections[4].description}>
              <DemoCard
                title="Toggle Loading"
                sourceCode={LoadingChartSource}
                sourcePath="examples/loading/LoadingChart.tsx"
                themeMode={themeMode}
              >
                <LoadingChart />
              </DemoCard>
            </DemoSection>

            <DemoSection id="component" title="Component" description={sections[5].description}>
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

            <DemoSection id="lazy" title="Lazy Init" description={sections[6].description}>
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
