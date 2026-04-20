import React from "react";
import { NavLink } from "react-router-dom";
import { galleryItems } from "../data/gallery";
import { featureItems } from "../data/features";
import Icon from "./Icon";
import type { DemoItem } from "../data/types";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${styles.link} ${isActive ? styles.active : ""}`;

interface SectionProps {
  readonly title: string;
  readonly count?: number;
  readonly children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, count, children }) => (
  <div className={styles.group}>
    <div className={styles.label}>
      <span>{title}</span>
      {count != null ? <span className={styles.count}>{count}</span> : null}
    </div>
    <nav className={styles.nav}>{children}</nav>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const renderItem = (item: DemoItem, base: string) => (
    <NavLink key={item.id} to={`${base}/${item.id}`} className={linkClass} onClick={onClose}>
      <span>{item.title}</span>
    </NavLink>
  );

  return (
    <>
      {isOpen ? <div className={styles.backdrop} onClick={onClose} role="presentation" /> : null}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <Section title="Start">
          <NavLink to="/" end className={linkClass} onClick={onClose}>
            <span>Overview</span>
            <span className={styles.tag}>intro</span>
          </NavLink>
          <NavLink to="/playground" className={linkClass} onClick={onClose}>
            <span>Playground</span>
            <span className={styles.tag}>live</span>
          </NavLink>
          <NavLink to="/compare" className={linkClass} onClick={onClose}>
            <span>Why this lib</span>
          </NavLink>
        </Section>

        <Section title="Gallery" count={galleryItems.length}>
          <NavLink to="/gallery" end className={linkClass} onClick={onClose}>
            <span>All charts</span>
          </NavLink>
          {galleryItems.map((i) => renderItem(i, "/gallery"))}
        </Section>

        <Section title="Features" count={featureItems.length}>
          <NavLink to="/features" end className={linkClass} onClick={onClose}>
            <span>All features</span>
          </NavLink>
          {featureItems.map((i) => renderItem(i, "/features"))}
        </Section>

        <Section title="Resources">
          <a
            className={styles.link}
            href="https://www.npmjs.com/package/react-use-echarts"
            target="_blank"
            rel="noreferrer"
          >
            <span>npm</span>
            <Icon name="external" size={11} />
          </a>
          <a
            className={styles.link}
            href="https://github.com/chensid/react-use-echarts"
            target="_blank"
            rel="noreferrer"
          >
            <span>GitHub</span>
            <Icon name="external" size={11} />
          </a>
          <a
            className={styles.link}
            href="https://echarts.apache.org/"
            target="_blank"
            rel="noreferrer"
          >
            <span>Apache ECharts</span>
            <Icon name="external" size={11} />
          </a>
        </Section>
      </aside>
    </>
  );
};

export default Sidebar;
