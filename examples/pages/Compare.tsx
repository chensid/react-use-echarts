import React from "react";
import PageHeader from "./PageHeader";
import CompareTable from "../components/CompareTable";
import styles from "./Compare.module.css";

const Compare: React.FC = () => (
  <>
    <PageHeader
      eyebrow="Why this lib"
      title="vs. raw ECharts &amp; alternatives"
      description="A small wrapper that solves predictable React integration problems — without taking anything away. ECharts itself stays the source of truth for options."
    />
    <CompareTable />

    <div className={styles.notes}>
      <div className={styles.note}>
        <span className={styles.noteIdx}>01</span>
        <h3>Single hook surface</h3>
        <p>
          <code>useEcharts(ref, &#123; option &#125;)</code> is the entire required API. Everything
          else — themes, lazy init, group linkage — is opt-in via the same options object.
        </p>
      </div>
      <div className={styles.note}>
        <span className={styles.noteIdx}>02</span>
        <h3>No option re-shaping</h3>
        <p>
          You pass <code>EChartsOption</code> directly. There is no abstraction layer between your
          code and the ECharts docs — copy-paste from official examples works as-is.
        </p>
      </div>
      <div className={styles.note}>
        <span className={styles.noteIdx}>03</span>
        <h3>Predictable lifecycle</h3>
        <p>
          Charts dispose on unmount, resize on container change, and respect React Strict Mode. The
          hook is safe to call inside any component, including ones that re-mount frequently.
        </p>
      </div>
      <div className={styles.note}>
        <span className={styles.noteIdx}>04</span>
        <h3>Both APIs available</h3>
        <p>
          Use <code>useEcharts</code> for the imperative hook style, or <code>&lt;EChart&gt;</code>{" "}
          for a declarative component with a forwarded ref. Both wrap the same instance internally.
        </p>
      </div>
    </div>
  </>
);

export default Compare;
