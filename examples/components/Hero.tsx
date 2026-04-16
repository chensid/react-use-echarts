import React, { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import styles from "./Hero.module.css";

const INSTALL_CMD = "npm install react-use-echarts echarts";

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
      <h1 className={styles.title}>react-use-echarts</h1>
      <p className={styles.tagline}>
        React hooks &amp; component for Apache ECharts — TypeScript, auto-resize, themes, lazy init.
      </p>

      <div className={styles.install}>
        <code className={styles.cmd}>{INSTALL_CMD}</code>
        <button
          type="button"
          className="btn"
          onClick={handleCopy}
          aria-label="Copy install command"
        >
          <Icon name={copied ? "check" : "copy"} size={14} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className={styles.ctaRow}>
        <Link to="/gallery" className={styles.ctaPrimary}>
          Browse Gallery
          <Icon name="arrow-right" size={14} />
        </Link>
        <a
          href="https://github.com/chensid/react-use-echarts"
          target="_blank"
          rel="noreferrer"
          className={styles.ctaSecondary}
        >
          <Icon name="github" size={14} />
          GitHub
        </a>
      </div>

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
    </section>
  );
};

export default Hero;
