import React from "react";
import Icon from "./Icon";
import styles from "./CompareTable.module.css";

interface Row {
  readonly label: string;
  /** `true` renders a check mark; anything else renders as text. */
  readonly hook: React.ReactNode;
  readonly other: React.ReactNode;
}

// Mirrors the comparison table under "Why react-use-echarts?" in README.md (and
// README-zh_CN.md). Change all three together so the site never contradicts the
// README.
const ROWS: readonly Row[] = [
  {
    label: "API",
    hook: (
      <>
        <code>useEcharts</code> hook <b>and</b> <code>&lt;EChart /&gt;</code> component
      </>
    ),
    other: "Component only",
  },
  {
    label: "Built for",
    hook: "React 19 — callback ref, StrictMode-safe",
    other: "React 16–18 era",
  },
  {
    label: "Auto-resize",
    hook: (
      <>
        <code>ResizeObserver</code> + RAF, on by default
      </>
    ),
    other: true,
  },
  {
    label: "Lazy init",
    hook: (
      <>
        Built-in <code>lazyInit</code> (IntersectionObserver)
      </>
    ),
    other: "Manual",
  },
  {
    label: "Chart linkage",
    hook: (
      <>
        Built-in <code>group</code> prop
      </>
    ),
    other: (
      <>
        Manual <code>echarts.connect</code>
      </>
    ),
  },
  {
    label: "Error routing",
    hook: (
      <>
        <code>onError</code> for handled chart operations and imperative API
      </>
    ),
    other: "Manual try/catch",
  },
  {
    label: "Format & deps",
    hook: "ESM-only, tree-shakeable, zero runtime deps",
    other: (
      <>
        CJS + ESM, 2 runtime deps (<code>size-sensor</code>, <code>fast-deep-equal</code>)
      </>
    ),
  },
];

const Cell: React.FC<{ readonly v: React.ReactNode }> = ({ v }) =>
  v === true ? (
    <span className={styles.yes} aria-label="Yes">
      <Icon name="check" size={14} />
    </span>
  ) : (
    <span className={styles.text}>{v}</span>
  );

const CompareTable: React.FC = () => (
  <div className={styles.tableWrap}>
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.thLabel}>Capability</th>
          <th className={`${styles.th} ${styles.thHook}`}>
            <span className={styles.tag}>this lib</span>
            react-use-echarts
          </th>
          <th className={styles.th}>
            <span className={styles.tag}>alt</span>
            echarts-for-react
          </th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map((r) => (
          <tr key={r.label}>
            <td className={styles.tdLabel}>{r.label}</td>
            <td className={`${styles.td} ${styles.tdHook}`}>
              <Cell v={r.hook} />
            </td>
            <td className={styles.td}>
              <Cell v={r.other} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default CompareTable;
