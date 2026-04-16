import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { useEcharts } from "../../src";
import { useTheme } from "./theme-context";
import type { EChartsOption } from "echarts";
import styles from "./ThumbCard.module.css";

interface ThumbCardProps {
  readonly to: string;
  readonly title: string;
  readonly description: string;
  readonly option: EChartsOption;
}

const ThumbCard: React.FC<ThumbCardProps> = ({ to, title, description, option }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { mode } = useTheme();

  useEcharts(chartRef, { option, theme: mode });

  return (
    <Link to={to} className={styles.card}>
      <div ref={chartRef} className={styles.thumb} />
      <div className={styles.meta}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.desc}>{description}</p>
      </div>
    </Link>
  );
};

export default ThumbCard;
