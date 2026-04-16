import React, { useState } from "react";
import styles from "./Hero.module.css";

const INSTALL_CMD = "npm install react-use-echarts echarts";

const FEATURES = [
  "TypeScript",
  "Auto-resize",
  "Themes",
  "Zero Deps",
  "Lazy Init",
  "StrictMode Safe",
] as const;

const Hero: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <section className={styles.hero}>
      <div className={styles.badges}>
        <img
          src="https://img.shields.io/npm/v/react-use-echarts.svg"
          alt="npm version"
          height="20"
        />
        <img
          src="https://img.shields.io/npm/dm/react-use-echarts.svg"
          alt="npm downloads"
          height="20"
        />
        <img
          src="https://img.shields.io/github/stars/chensid/react-use-echarts?style=social"
          alt="GitHub stars"
          height="20"
        />
      </div>

      <h1 className={styles.title}>react-use-echarts</h1>
      <p className={styles.tagline}>
        React hooks &amp; component for Apache ECharts — TypeScript, auto-resize, themes, lazy init.
      </p>

      <div className={styles.features}>
        {FEATURES.map((f) => (
          <span key={f} className={styles.tag}>
            {f}
          </span>
        ))}
      </div>

      <div className={styles.install}>
        <code className={styles.cmd}>{INSTALL_CMD}</code>
        <button type="button" className="btn" onClick={handleCopy}>
          {copied ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <a href="#basic" className={styles.cta}>
        Get Started
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      </a>
    </section>
  );
};

export default Hero;
