import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { useEcharts } from "../../src";
import { useTheme } from "./theme-context";
import Icon from "./Icon";
import type { EChartsOption } from "echarts";
import styles from "./ThumbCard.module.css";

interface ThumbCardProps {
  readonly to: string;
  readonly title: string;
  readonly description: string;
  readonly option: EChartsOption;
  readonly tag?: string;
}

const ThumbCard: React.FC<ThumbCardProps> = ({ to, title, description, option, tag }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { mode } = useTheme();

  useEcharts(chartRef, { option, theme: mode });

  return (
    <Link to={to} className={styles.card}>
      <div className={styles.head}>
        <span className={styles.headTitle}>{title}.tsx</span>
        {tag ? <span className={styles.headTag}>{tag}</span> : null}
      </div>
      <div className={styles.thumbWrap}>
        <div ref={chartRef} className={styles.thumb} />
      </div>
      <div className={styles.meta}>
        <div className={styles.metaText}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.desc}>{description}</p>
        </div>
        <span className={styles.arrow}>
          <Icon name="arrow-right" size={14} />
        </span>
      </div>
    </Link>
  );
};

export default ThumbCard;
