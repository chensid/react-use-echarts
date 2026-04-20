import React from "react";
import { Link, NavLink } from "react-router-dom";
import Icon from "./Icon";
import { useTheme } from "./theme-context";
import { APP_VERSION } from "../data/meta";
import styles from "./Header.module.css";

interface HeaderProps {
  readonly onSidebarToggle: () => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`;

const Header: React.FC<HeaderProps> = ({ onSidebarToggle }) => {
  const { mode, toggle } = useTheme();

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <button
            type="button"
            className={styles.burger}
            onClick={onSidebarToggle}
            aria-label="Toggle navigation"
          >
            <Icon name="menu" size={18} />
          </button>
          <Link to="/" className={styles.brand} aria-label="Home">
            <span className={styles.mark}>
              <svg width="14" height="14" viewBox="0 0 32 32" aria-hidden>
                <path
                  d="M7 22V10h3v12H7zm5-4V10h3v8h-3zm5 2V10h3v10h-3zm5-6V10h3v4h-3z"
                  fill="var(--c-accent-inv)"
                />
              </svg>
            </span>
            <span className={styles.name}>
              <b>react-use-echarts</b>
            </span>
          </Link>
          <span className={styles.version} title="latest release">
            <span className={styles.verDot} />v{APP_VERSION}
          </span>
          <nav className={styles.nav}>
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/gallery" className={navLinkClass}>
              Gallery
            </NavLink>
            <NavLink to="/features" className={navLinkClass}>
              Features
            </NavLink>
            <NavLink to="/playground" className={navLinkClass}>
              Playground
            </NavLink>
          </nav>
        </div>
        <div className={styles.right}>
          <a
            className={styles.iconBtn}
            href="https://github.com/chensid/react-use-echarts"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
            <Icon name="github" size={14} />
          </a>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={toggle}
            aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <Icon name={mode === "dark" ? "sun" : "moon"} size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
