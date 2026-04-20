import React from "react";
import { APP_VERSION } from "../data/meta";
import styles from "./Footer.module.css";

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.row}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <svg width="14" height="14" viewBox="0 0 32 32" aria-hidden>
              <path
                d="M7 22V10h3v12H7zm5-4V10h3v8h-3zm5 2V10h3v10h-3zm5-6V10h3v4h-3z"
                fill="var(--c-accent-inv)"
              />
            </svg>
          </span>
          <span>
            <b>react-use-echarts</b>
          </span>
          <span className={styles.dot}>·</span>
          <span className={styles.dim}>v{APP_VERSION} · MIT</span>
        </div>
        <nav className={styles.links}>
          <a
            href="https://www.npmjs.com/package/react-use-echarts"
            target="_blank"
            rel="noreferrer"
          >
            npm
          </a>
          <a href="https://github.com/chensid/react-use-echarts" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a
            href="https://github.com/chensid/react-use-echarts#api-reference"
            target="_blank"
            rel="noreferrer"
          >
            API
          </a>
          <a href="https://echarts.apache.org/" target="_blank" rel="noreferrer">
            ECharts ↗
          </a>
        </nav>
      </div>
      <p className={styles.copy}>
        Built with React + ECharts 6. Open-source software released under the MIT license.
      </p>
    </footer>
  );
};

export default Footer;
