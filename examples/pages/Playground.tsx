import React, { useMemo, useRef, useState } from "react";
import { useEcharts } from "../../src";
import { useTheme } from "../components/theme-context";
import PageHeader from "./PageHeader";
import Icon from "../components/Icon";
import type { EChartsOption } from "echarts";
import styles from "./Playground.module.css";

type SeriesType = "bar" | "line" | "scatter";

interface State {
  readonly series: SeriesType;
  readonly smooth: boolean;
  readonly area: boolean;
  readonly stack: boolean;
  readonly horizontal: boolean;
  readonly showLegend: boolean;
  readonly showGrid: boolean;
  readonly itemSize: number;
}

const DEFAULT: State = {
  series: "bar",
  smooth: true,
  area: false,
  stack: false,
  horizontal: false,
  showLegend: true,
  showGrid: true,
  itemSize: 12,
};

const X = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const A = [120, 132, 101, 134, 90, 230, 210];
const B = [220, 182, 191, 234, 290, 330, 310];

const buildOption = (s: State): EChartsOption => {
  const cat = { type: "category" as const, data: X, axisTick: { show: false } };
  const val = {
    type: "value" as const,
    splitLine: s.showGrid ? {} : { show: false },
  };

  return {
    backgroundColor: "transparent",
    tooltip: { trigger: s.series === "scatter" ? "item" : "axis" },
    legend: s.showLegend ? { bottom: 0, data: ["Series A", "Series B"] } : { show: false },
    grid: { top: 28, bottom: s.showLegend ? 36 : 16, left: 44, right: 16 },
    xAxis: s.horizontal ? val : cat,
    yAxis: s.horizontal ? cat : val,
    series: [
      {
        name: "Series A",
        type: s.series,
        data: A,
        smooth: s.series === "line" ? s.smooth : undefined,
        areaStyle: s.series === "line" && s.area ? { opacity: 0.2 } : undefined,
        stack: s.stack ? "total" : undefined,
        symbolSize: s.itemSize,
        itemStyle: s.series === "bar" ? { borderRadius: [3, 3, 0, 0] } : undefined,
      },
      {
        name: "Series B",
        type: s.series,
        data: B,
        smooth: s.series === "line" ? s.smooth : undefined,
        areaStyle: s.series === "line" && s.area ? { opacity: 0.2 } : undefined,
        stack: s.stack ? "total" : undefined,
        symbolSize: s.itemSize,
        itemStyle: s.series === "bar" ? { borderRadius: [3, 3, 0, 0] } : undefined,
      },
    ],
  };
};

const Playground: React.FC = () => {
  const [state, setState] = useState<State>(DEFAULT);
  const { mode } = useTheme();
  const chartRef = useRef<HTMLDivElement>(null);

  const option = useMemo(() => buildOption(state), [state]);
  useEcharts(chartRef, { option, theme: mode });

  const set = <K extends keyof State>(k: K, v: State[K]) =>
    setState((prev) => ({ ...prev, [k]: v }));

  const codeStr = useMemo(() => {
    const lines = [
      `import { useEcharts } from "react-use-echarts";`,
      "",
      `const ref = useRef<HTMLDivElement>(null);`,
      `useEcharts(ref, {`,
      `  option: {`,
      `    legend: ${state.showLegend ? "{ bottom: 0 }" : "{ show: false }"},`,
      `    xAxis: ${state.horizontal ? '{ type: "value" }' : '{ type: "category", data: days }'},`,
      `    yAxis: ${state.horizontal ? '{ type: "category", data: days }' : '{ type: "value" }'},`,
      `    series: [`,
      `      {`,
      `        type: "${state.series}",`,
      `        data: a,`,
      state.series === "line" ? `        smooth: ${state.smooth},` : "",
      state.series === "line" && state.area ? `        areaStyle: { opacity: 0.2 },` : "",
      state.stack ? `        stack: "total",` : "",
      state.series !== "bar" ? `        symbolSize: ${state.itemSize},` : "",
      `      },`,
      `      // …Series B`,
      `    ],`,
      `  },`,
      `});`,
    ];
    return lines.filter(Boolean).join("\n");
  }, [state]);

  return (
    <>
      <PageHeader
        eyebrow="Playground"
        title="Live option editor"
        description="Tweak common option flags in the panel below — the chart and the code update together."
        meta={
          <>
            <span className={styles.tag}>useEcharts()</span>
            <span className={styles.tag}>theme: {mode}</span>
          </>
        }
      />
      <div className={styles.layout}>
        <aside className={styles.controls}>
          <div className={styles.group}>
            <div className={styles.groupTitle}>series.type</div>
            <div className={styles.segment} role="tablist">
              {(["bar", "line", "scatter"] as SeriesType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={state.series === t}
                  className={`${styles.segBtn} ${state.series === t ? styles.segBtnActive : ""}`}
                  onClick={() => set("series", t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.group}>
            <div className={styles.groupTitle}>flags</div>
            <Toggle
              label="line.smooth"
              v={state.smooth}
              on={(v) => set("smooth", v)}
              disabled={state.series !== "line"}
            />
            <Toggle
              label="series.areaStyle"
              v={state.area}
              on={(v) => set("area", v)}
              disabled={state.series !== "line"}
            />
            <Toggle label='series.stack = "total"' v={state.stack} on={(v) => set("stack", v)} />
            <Toggle label="horizontal axes" v={state.horizontal} on={(v) => set("horizontal", v)} />
            <Toggle label="legend" v={state.showLegend} on={(v) => set("showLegend", v)} />
            <Toggle label="splitLine" v={state.showGrid} on={(v) => set("showGrid", v)} />
          </div>

          <div className={styles.group}>
            <div className={styles.groupTitle}>symbolSize</div>
            <input
              type="range"
              min={4}
              max={28}
              step={1}
              value={state.itemSize}
              onChange={(e) => set("itemSize", Number(e.target.value))}
              className={styles.range}
              disabled={state.series === "bar"}
            />
            <div className={styles.rangeRow}>
              <span>4</span>
              <span className={styles.rangeVal}>{state.itemSize}px</span>
              <span>28</span>
            </div>
          </div>

          <button type="button" className={styles.reset} onClick={() => setState(DEFAULT)}>
            <Icon name="spinner" size={13} />
            Reset to defaults
          </button>
        </aside>

        <div className={styles.right}>
          <div className={styles.previewCard}>
            <div className={styles.previewHead}>
              <span className={styles.windowDot} />
              <span className={styles.windowDot} />
              <span className={styles.windowDot} />
              <span className={styles.windowTitle}>preview · live</span>
            </div>
            <div ref={chartRef} className={styles.chart} />
          </div>
          <div className={styles.codeCard}>
            <div className={styles.codeHead}>
              <span className={styles.codeTab}>generated.tsx</span>
            </div>
            <pre className={styles.code}>
              <code>{codeStr}</code>
            </pre>
          </div>
        </div>
      </div>
    </>
  );
};

const Toggle: React.FC<{
  readonly label: string;
  readonly v: boolean;
  readonly on: (v: boolean) => void;
  readonly disabled?: boolean;
}> = ({ label, v, on, disabled }) => (
  <div className={`${styles.toggle} ${disabled ? styles.toggleDisabled : ""}`}>
    <span className={styles.toggleLabel}>{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={v}
      aria-label={label}
      disabled={disabled}
      className={`${styles.switch} ${v ? styles.switchOn : ""}`}
      onClick={() => on(!v)}
    >
      <span className={styles.switchKnob} />
    </button>
  </div>
);

export default Playground;
