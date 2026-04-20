import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useEcharts } from "../../src";
import { useTheme } from "./theme-context";
import Icon from "./Icon";
import { APP_VERSION, ECHARTS_MAJOR, REACT_MAJOR } from "../data/meta";
import type { EChartsOption } from "echarts";
import styles from "./Hero.module.css";

const INSTALL_CMD = "npm install react-use-echarts echarts";

type DemoTab = "bar" | "line" | "component";

const heroOptions: Record<DemoTab, EChartsOption> = {
  bar: {
    backgroundColor: "transparent",
    grid: { top: 24, bottom: 28, left: 36, right: 12 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      axisTick: { show: false },
    },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: [23, 24, 18, 25, 27, 28, 25],
        itemStyle: { borderRadius: [3, 3, 0, 0] },
        barWidth: "55%",
      },
    ],
  },
  line: {
    backgroundColor: "transparent",
    grid: { top: 24, bottom: 28, left: 36, right: 12 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      axisTick: { show: false },
    },
    yAxis: { type: "value" },
    series: [
      {
        type: "line",
        smooth: true,
        showSymbol: false,
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        areaStyle: { opacity: 0.15 },
        lineStyle: { width: 2 },
      },
    ],
  },
  component: {
    backgroundColor: "transparent",
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: ["46%", "70%"],
        center: ["50%", "44%"],
        label: { show: false },
        data: [
          { value: 1048, name: "Search" },
          { value: 735, name: "Direct" },
          { value: 580, name: "Email" },
          { value: 484, name: "Social" },
        ],
      },
    ],
  },
};

const codeSnippets: Record<DemoTab, string> = {
  bar: `import { useEcharts } from "react-use-echarts";

export const BarChart = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEcharts(ref, {
    option: {
      xAxis: { data: days },
      yAxis: {},
      series: [{ type: "bar", data: sales }],
    },
  });
  return <div ref={ref} style={{ height: 320 }} />;
};`,
  line: `import { useEcharts } from "react-use-echarts";

export const LineChart = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEcharts(ref, {
    option: {
      xAxis: { type: "category", data: days },
      yAxis: { type: "value" },
      series: [{ type: "line", smooth: true, data: trend }],
    },
  });
  return <div ref={ref} style={{ height: 320 }} />;
};`,
  component: `import { EChart } from "react-use-echarts";

export const Pie = () => {
  const ref = useRef<UseEchartsReturn>(null);

  return (
    <EChart
      ref={ref}
      option={{ series: [{ type: "pie", data }] }}
      style={{ height: 320 }}
    />
  );
};`,
};

const Hero: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<DemoTab>("bar");
  const chartRef = useRef<HTMLDivElement>(null);
  const { mode } = useTheme();

  const option = heroOptions[tab];
  useEcharts(chartRef, { option, theme: mode });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <section className={styles.hero}>
      <div className={styles.left}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />v{APP_VERSION} · ECharts {ECHARTS_MAJOR} · React{" "}
          {REACT_MAJOR}+
        </div>
        <h1 className={styles.title}>
          The minimal hook
          <br />
          for Apache <span className={styles.titleAccent}>ECharts</span>
        </h1>
        <p className={styles.tagline}>
          One <code className={styles.inlineCode}>useEcharts</code> hook. Zero deps. Auto-resize,
          theme switching, lazy init, full TypeScript — for everything ECharts can render.
        </p>

        <div className={styles.install}>
          <span className={styles.prompt}>$</span>
          <code className={styles.cmd}>{INSTALL_CMD}</code>
          <button
            type="button"
            className={styles.copyBtn}
            onClick={handleCopy}
            aria-label="Copy install command"
          >
            <Icon name={copied ? "check" : "copy"} size={13} />
          </button>
        </div>

        <div className={styles.ctaRow}>
          <Link to="/gallery" className="cta-primary">
            Browse 8 charts
            <Icon name="arrow-right" size={14} />
          </Link>
          <Link to="/playground" className="cta-secondary">
            Open playground
          </Link>
          <a
            href="https://github.com/chensid/react-use-echarts"
            target="_blank"
            rel="noreferrer"
            className="cta-secondary"
          >
            <Icon name="github" size={13} />
            GitHub
          </a>
        </div>

        <dl className={styles.metaRow}>
          <div>
            <dt>Bundle</dt>
            <dd>
              2.1 kB <span>min+gzip</span>
            </dd>
          </div>
          <div>
            <dt>Deps</dt>
            <dd>
              0 <span>peer: echarts</span>
            </dd>
          </div>
          <div>
            <dt>Types</dt>
            <dd>
              built-in <span>strict</span>
            </dd>
          </div>
        </dl>
      </div>

      <div className={styles.right}>
        <div className={styles.panel}>
          <div className={styles.panelTabs} role="tablist">
            {(["bar", "line", "component"] as DemoTab[]).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={`${styles.panelTab} ${tab === t ? styles.panelTabActive : ""}`}
                onClick={() => setTab(t)}
              >
                {t === "component" ? "<EChart>" : `${t}.tsx`}
              </button>
            ))}
            <span className={styles.panelStatus}>
              <span className={styles.statusDot} />
              live
            </span>
          </div>
          <div className={styles.panelBody}>
            <pre className={styles.code}>
              <code>{codeSnippets[tab]}</code>
            </pre>
            <div className={styles.divider} />
            <div className={styles.preview}>
              <div ref={chartRef} className={styles.chart} />
            </div>
          </div>
          <div className={styles.panelFoot}>
            <span className={styles.footTag}>useEcharts()</span>
            <span className={styles.footMeta}>auto-resize · theme: {mode}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
