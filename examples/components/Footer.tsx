import React from "react";
import styles from "./Footer.module.css";

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        <a href="https://www.npmjs.com/package/react-use-echarts" target="_blank" rel="noreferrer">
          npm
        </a>
        <span className={styles.dot}>·</span>
        <a href="https://github.com/chensid/react-use-echarts" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <span className={styles.dot}>·</span>
        <a
          href="https://github.com/chensid/react-use-echarts#api-reference"
          target="_blank"
          rel="noreferrer"
        >
          API Reference
        </a>
      </div>
      <p className={styles.copy}>MIT License · Built with React + ECharts</p>
    </footer>
  );
};

export default Footer;
