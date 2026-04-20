import React from "react";
import Icon from "./Icon";
import styles from "./CompareTable.module.css";

interface Row {
  readonly label: string;
  readonly hook: boolean | string;
  readonly raw: boolean | string;
  readonly other: boolean | string;
}

const ROWS: readonly Row[] = [
  { label: "Bundle (min+gzip)", hook: "2.1 kB", raw: "—", other: "8–14 kB" },
  { label: "Auto-resize on container change", hook: true, raw: false, other: "varies" },
  { label: "Lazy init via IntersectionObserver", hook: true, raw: false, other: false },
  { label: "Theme switching at runtime", hook: true, raw: "manual", other: "varies" },
  { label: "Imperative ref API (resize/setOption)", hook: true, raw: true, other: "varies" },
  { label: "Chart group linkage helper", hook: true, raw: "manual", other: false },
  { label: "Loading overlay toggle", hook: true, raw: "manual", other: "varies" },
  { label: "TypeScript types (strict)", hook: true, raw: true, other: "varies" },
];

const Cell: React.FC<{ readonly v: boolean | string }> = ({ v }) => {
  if (v === true)
    return (
      <span className={styles.yes}>
        <Icon name="check" size={14} />
      </span>
    );
  if (v === false) return <span className={styles.no}>—</span>;
  return <span className={styles.txt}>{v}</span>;
};

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
            <span className={styles.tag}>raw</span>
            echarts only
          </th>
          <th className={styles.th}>
            <span className={styles.tag}>alt</span>
            other wrappers
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
              <Cell v={r.raw} />
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
