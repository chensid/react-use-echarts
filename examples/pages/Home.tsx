import React from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import Icon, { type IconName } from "../components/Icon";
import styles from "./Home.module.css";

interface EntryCardProps {
  readonly to: string;
  readonly icon: IconName;
  readonly title: string;
  readonly description: string;
  readonly cta: string;
}

const EntryCard: React.FC<EntryCardProps> = ({ to, icon, title, description, cta }) => (
  <Link to={to} className={styles.entryCard}>
    <div className={styles.entryIcon}>
      <Icon name={icon} size={22} />
    </div>
    <h2 className={styles.entryTitle}>{title}</h2>
    <p className={styles.entryDesc}>{description}</p>
    <span className={styles.entryFooter}>
      {cta}
      <Icon name="arrow-right" size={14} />
    </span>
  </Link>
);

const Home: React.FC = () => (
  <>
    <Hero />
    <p className={styles.sectionTitle}>Explore</p>
    <div className={styles.entries}>
      <EntryCard
        to="/gallery"
        icon="gallery"
        title="Gallery"
        description="Eight common chart types — bar, line, radar, gauge, candlestick, heatmap, funnel, and treemap — ready to copy."
        cta="Browse charts"
      />
      <EntryCard
        to="/features"
        icon="features"
        title="Features"
        description="Dynamic data, themes, renderer switching, chart linkage, events, loading, ref API, and lazy init."
        cta="Explore features"
      />
    </div>
  </>
);

export default Home;
