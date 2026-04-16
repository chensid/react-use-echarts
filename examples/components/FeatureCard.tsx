import React from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import type { FeatureItem } from "../data/features";
import styles from "./FeatureCard.module.css";

interface FeatureCardProps {
  readonly item: FeatureItem;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ item }) => {
  return (
    <Link to={`/features/${item.id}`} className={styles.card}>
      <div className={styles.iconWrap}>
        <Icon name={item.icon} size={18} />
      </div>
      <h3 className={styles.title}>{item.title}</h3>
      <p className={styles.desc}>{item.description}</p>
      <span className={styles.footer}>
        Try it
        <Icon name="arrow-right" size={14} />
      </span>
    </Link>
  );
};

export default FeatureCard;
