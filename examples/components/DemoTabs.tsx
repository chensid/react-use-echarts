import React, { useEffect, useState } from "react";
import Icon from "./Icon";
import { githubUrl } from "../utils/github";
import styles from "./DemoTabs.module.css";

const LazyCodeBlock = React.lazy(() => import("./CodeBlock"));

interface DemoTabsProps {
  readonly sourcePath: string;
  readonly loadSource: () => Promise<string>;
  readonly children: React.ReactNode;
}

type Tab = "preview" | "code";

const DemoTabs: React.FC<DemoTabsProps> = ({ sourcePath, loadSource, children }) => {
  const [tab, setTab] = useState<Tab>("preview");
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== "code" || source !== null) return;
    let disposed = false;
    loadSource()
      .then((code) => {
        if (!disposed) setSource(code);
      })
      .catch(() => {
        if (!disposed) setSource("// Failed to load source");
      });
    return () => {
      disposed = true;
    };
  }, [tab, source, loadSource]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "preview"}
            className={`${styles.tab} ${tab === "preview" ? styles.tabActive : ""}`}
            onClick={() => setTab("preview")}
          >
            Preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "code"}
            className={`${styles.tab} ${tab === "code" ? styles.tabActive : ""}`}
            onClick={() => setTab("code")}
          >
            Code
          </button>
        </div>
        <div className={styles.actions}>
          <a
            className={styles.iconLink}
            href={githubUrl(sourcePath)}
            target="_blank"
            rel="noreferrer"
            aria-label="View on GitHub"
            title="View on GitHub"
          >
            <Icon name="github" size={14} />
          </a>
        </div>
      </div>
      <div className={`${styles.body} ${tab === "code" ? styles.bodyCode : ""}`}>
        {tab === "preview" ? (
          children
        ) : source === null ? (
          <pre className={styles.placeholder}>Loading source…</pre>
        ) : (
          <React.Suspense fallback={<pre className={styles.placeholder}>Loading…</pre>}>
            <LazyCodeBlock code={source} language="tsx" />
          </React.Suspense>
        )}
      </div>
    </div>
  );
};

export default DemoTabs;
