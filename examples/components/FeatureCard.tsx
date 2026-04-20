import React from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import type { FeatureItem } from "../data/features";
import styles from "./FeatureCard.module.css";

interface FeatureCardProps {
  readonly item: FeatureItem;
  readonly index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ item, index }) => {
  return (
    <Link to={`/features/${item.id}`} className={styles.card}>
      <div className={styles.top}>
        <span className={styles.idx}>{String(index + 1).padStart(2, "0")}</span>
        <Icon name={item.icon} size={16} className={styles.icon} />
      </div>
      <h3 className={styles.title}>{item.title}</h3>
      <p className={styles.desc}>{item.description}</p>
      <div className={styles.foot}>
        <span className={styles.id}>id: {item.id}</span>
        <span className={styles.cta}>
          <Icon name="arrow-right" size={13} />
        </span>
      </div>
    </Link>
  );
};

export default FeatureCard;
