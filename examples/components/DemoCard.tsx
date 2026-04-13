import React, { useState } from "react";
import type { ThemeMode } from "./Header";
import styles from "./DemoCard.module.css";

const LazyCodeBlock = React.lazy(() => import("./CodeBlock"));

interface DemoCardProps {
  readonly title: string;
  readonly description?: string;
  readonly sourceCode: string;
  readonly sourcePath: string;
  readonly codeLanguage?: "tsx";
  readonly themeMode: ThemeMode;
  readonly children: React.ReactNode;
}

const DemoCard: React.FC<DemoCardProps> = ({
  title,
  description,
  sourceCode,
  sourcePath,
  codeLanguage = "tsx",
  themeMode,
  children,
}) => {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div>
          <h3 className={styles.title}>{title}</h3>
          {description ? <p className={styles.desc}>{description}</p> : null}
        </div>
        <button type="button" className="btn" onClick={() => setShowCode((p) => !p)}>
          {showCode ? "Hide" : "Code"}
        </button>
      </div>
      <div className={styles.body}>{children}</div>
      {showCode ? (
        <div className={styles.code}>
          <span className={styles.path}>{sourcePath}</span>
          <React.Suspense fallback={<pre className={styles.placeholder}>Loading...</pre>}>
            <LazyCodeBlock code={sourceCode} language={codeLanguage} themeMode={themeMode} />
          </React.Suspense>
        </div>
      ) : null}
    </div>
  );
};

export default DemoCard;
