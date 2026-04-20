import React from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import StatsStrip from "../components/StatsStrip";
import CompareTable from "../components/CompareTable";
import FeatureCard from "../components/FeatureCard";
import ThumbCard from "../components/ThumbCard";
import Icon from "../components/Icon";
import { featureItems } from "../data/features";
import { galleryItems } from "../data/gallery";
import { thumbOptions } from "../data/thumbs";
import styles from "./Home.module.css";

const Home: React.FC = () => (
  <>
    <Hero />

    <StatsStrip />

    <section id="features" className={styles.section}>
      <header className={styles.sectionHead}>
        <div>
          <span className={styles.kicker}>Capabilities</span>
          <h2 className={styles.sectionTitle}>Built for real ECharts use</h2>
          <p className={styles.sectionLead}>
            Eight features cover the gaps people fill manually: reactivity, themes, renderer choice,
            group linkage, events, loading, ref API, and lazy initialization.
          </p>
        </div>
        <Link to="/features" className={styles.headLink}>
          All features
          <Icon name="arrow-right" size={13} />
        </Link>
      </header>
      <div className={styles.featureGrid}>
        {featureItems.map((item, i) => (
          <FeatureCard key={item.id} item={item} index={i} />
        ))}
      </div>
    </section>

    <section className={styles.section}>
      <header className={styles.sectionHead}>
        <div>
          <span className={styles.kicker}>Why this lib</span>
          <h2 className={styles.sectionTitle}>vs. raw ECharts &amp; alternatives</h2>
          <p className={styles.sectionLead}>
            A small wrapper that solves the predictable React integration problems — without locking
            you out of any ECharts API.
          </p>
        </div>
        <Link to="/compare" className={styles.headLink}>
          Full comparison
          <Icon name="arrow-right" size={13} />
        </Link>
      </header>
      <CompareTable />
    </section>

    <section className={styles.section}>
      <header className={styles.sectionHead}>
        <div>
          <span className={styles.kicker}>Gallery preview</span>
          <h2 className={styles.sectionTitle}>Charts ready to copy</h2>
          <p className={styles.sectionLead}>
            Each example is a single self-contained component. Hover into any card to see the chart,
            then jump to the source.
          </p>
        </div>
        <Link to="/gallery" className={styles.headLink}>
          All {galleryItems.length} charts
          <Icon name="arrow-right" size={13} />
        </Link>
      </header>
      <div className={styles.galleryGrid}>
        {galleryItems.slice(0, 4).map((item) => (
          <ThumbCard
            key={item.id}
            to={`/gallery/${item.id}`}
            title={item.title}
            description={item.description}
            option={thumbOptions[item.id]}
          />
        ))}
      </div>
    </section>

    <section className={`${styles.section} ${styles.outroSection}`}>
      <div className={styles.outro}>
        <div>
          <span className={styles.kicker}>Get started</span>
          <h2 className={styles.outroTitle}>Drop a hook in. Ship a chart.</h2>
          <p className={styles.sectionLead}>
            Open the playground to tweak options live, or pull any gallery example into your own
            project.
          </p>
        </div>
        <div className={styles.outroCtas}>
          <Link to="/playground" className="cta-primary">
            Open playground
            <Icon name="arrow-right" size={14} />
          </Link>
          <a
            className="cta-secondary"
            href="https://github.com/chensid/react-use-echarts#readme"
            target="_blank"
            rel="noreferrer"
          >
            Read the docs
          </a>
        </div>
      </div>
    </section>
  </>
);

export default Home;
