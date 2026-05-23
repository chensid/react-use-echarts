import React, { useMemo, useState } from "react";
import { useEcharts } from "../../src";
import { useTheme } from "../components/theme-context";
import PageHeader from "./PageHeader";
import Icon from "../components/Icon";
import type { EChartsOption } from "echarts";
import styles from "./Playground.module.css";

const SERIES_TYPES = ["bar", "line", "scatter"] as const;
type SeriesType = (typeof SERIES_TYPES)[number];

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

const buildCodeSample = (state: State): string => {
  const lines = [
    `import { useEcharts } from "react-use-echarts";`,
    "",
    `const { ref } = useEcharts({`,
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
    `      // ...Series B`,
    `    ],`,
    `  },`,
    `});`,
  ];
  return lines.filter(Boolean).join("\n");
};

const Playground: React.FC = () => {
  const [state, setState] = useState<State>(DEFAULT);
  const { mode } = useTheme();

  const option = useMemo(() => buildOption(state), [state]);
  const { ref } = useEcharts({ option, theme: mode });

  const updateState = <K extends keyof State>(key: K, value: State[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const codeStr = useMemo(() => buildCodeSample(state), [state]);

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
        <ControlsPanel state={state} onChange={updateState} onReset={() => setState(DEFAULT)} />
        <PreviewPanel chartRef={ref} code={codeStr} />
      </div>
    </>
  );
};

interface ControlsPanelProps {
  readonly state: State;
  readonly onChange: <K extends keyof State>(key: K, value: State[K]) => void;
  readonly onReset: () => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({ state, onChange, onReset }) => (
  <aside className={styles.controls}>
    <div className={styles.group}>
      <div className={styles.groupTitle}>series.type</div>
      <div className={styles.segment} role="tablist">
        {SERIES_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={state.series === type}
            className={`${styles.segBtn} ${state.series === type ? styles.segBtnActive : ""}`}
            onClick={() => onChange("series", type)}
          >
            {type}
          </button>
        ))}
      </div>
    </div>

    <div className={styles.group}>
      <div className={styles.groupTitle}>flags</div>
      <Toggle
        label="line.smooth"
        v={state.smooth}
        on={(value) => onChange("smooth", value)}
        disabled={state.series !== "line"}
      />
      <Toggle
        label="series.areaStyle"
        v={state.area}
        on={(value) => onChange("area", value)}
        disabled={state.series !== "line"}
      />
      <Toggle
        label='series.stack = "total"'
        v={state.stack}
        on={(value) => onChange("stack", value)}
      />
      <Toggle
        label="horizontal axes"
        v={state.horizontal}
        on={(value) => onChange("horizontal", value)}
      />
      <Toggle label="legend" v={state.showLegend} on={(value) => onChange("showLegend", value)} />
      <Toggle label="splitLine" v={state.showGrid} on={(value) => onChange("showGrid", value)} />
    </div>

    <div className={styles.group}>
      <div className={styles.groupTitle}>symbolSize</div>
      <input
        type="range"
        min={4}
        max={28}
        step={1}
        value={state.itemSize}
        onChange={(event) => onChange("itemSize", Number(event.target.value))}
        className={styles.range}
        disabled={state.series === "bar"}
      />
      <div className={styles.rangeRow}>
        <span>4</span>
        <span className={styles.rangeVal}>{state.itemSize}px</span>
        <span>28</span>
      </div>
    </div>

    <button type="button" className={styles.reset} onClick={onReset}>
      <Icon name="spinner" size={13} />
      Reset to defaults
    </button>
  </aside>
);

interface PreviewPanelProps {
  readonly chartRef: React.RefCallback<HTMLDivElement>;
  readonly code: string;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ chartRef, code }) => (
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
        <code>{code}</code>
      </pre>
    </div>
  </div>
);

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
