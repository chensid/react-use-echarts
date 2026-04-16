import React from "react";
import { NavLink } from "react-router-dom";
import { galleryItems } from "../data/gallery";
import { featureItems } from "../data/features";
import type { DemoItem } from "../data/types";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `${styles.link} ${isActive ? styles.active : ""}`;

const headingClass = ({ isActive }: { isActive: boolean }) =>
  `${styles.heading} ${isActive ? styles.headingActive : ""}`;

interface SectionProps {
  readonly title: string;
  readonly to: string;
  readonly items: readonly DemoItem[];
  readonly basePath: string;
  readonly onClose: () => void;
}

const Section: React.FC<SectionProps> = ({ title, to, items, basePath, onClose }) => (
  <>
    <NavLink to={to} end className={headingClass} onClick={onClose}>
      {title}
    </NavLink>
    {items.map((item) => (
      <NavLink key={item.id} to={`${basePath}/${item.id}`} className={itemClass} onClick={onClose}>
        {item.title}
      </NavLink>
    ))}
  </>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen ? <div className={styles.backdrop} onClick={onClose} role="presentation" /> : null}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <nav className={styles.nav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.link} ${styles.topLink} ${isActive ? styles.active : ""}`
            }
            onClick={onClose}
          >
            Home
          </NavLink>

          <Section
            title="Gallery"
            to="/gallery"
            items={galleryItems}
            basePath="/gallery"
            onClose={onClose}
          />

          <Section
            title="Features"
            to="/features"
            items={featureItems}
            basePath="/features"
            onClose={onClose}
          />
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
