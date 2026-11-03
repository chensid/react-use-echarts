import React from "react";
import { featureItems } from "../data/features";
import { CHART_COUNT, galleryItems } from "../data/gallery";
import { BUNDLE_SIZE } from "../data/meta";
import styles from "./StatsStrip.module.css";

interface Stat {
  readonly label: string;
  readonly value: string;
  readonly note: string;
}

// The notes list item titles from the data, so they follow the gallery and the
// feature list as demos are added or removed.
const titles = (items: readonly { readonly title: string }[]) =>
  items.map((i) => i.title.toLowerCase()).join(", ");

const STATS: readonly Stat[] = [
  { label: "Bundle size", value: BUNDLE_SIZE, note: "min + gzip · zero runtime deps" },
  {
    label: "Chart types",
    value: String(CHART_COUNT),
    note: titles(galleryItems),
  },
  {
    label: "Features",
    value: String(featureItems.length),
    note: `${titles(featureItems.slice(0, 5))}…`,
  },
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
