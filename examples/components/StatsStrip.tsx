import React from "react";
import styles from "./StatsStrip.module.css";

interface Stat {
  readonly label: string;
  readonly value: string;
  readonly note: string;
}

const STATS: readonly Stat[] = [
  { label: "Bundle size", value: "2.1 kB", note: "min + gzip · zero runtime deps" },
  {
    label: "Chart types",
    value: "8",
    note: "bar, line, radar, gauge, ohlc, heat, funnel, treemap",
  },
  { label: "Features", value: "8", note: "themes, renderer, linkage, lazy, events, ref…" },
  { label: "TypeScript", value: "100%", note: "strict mode · full ECharts option types" },
];

const StatsStrip: React.FC = () => (
  <section className={styles.strip} aria-label="Key stats">
    {STATS.map((s, i) => (
      <div key={s.label} className={styles.cell}>
        <span className={styles.idx}>{String(i + 1).padStart(2, "0")}</span>
        <div>
          <div className={styles.value}>{s.value}</div>
          <div className={styles.label}>{s.label}</div>
          <div className={styles.note}>{s.note}</div>
        </div>
      </div>
    ))}
  </section>
);

export default StatsStrip;
