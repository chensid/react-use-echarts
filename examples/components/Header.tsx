import React from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import { useTheme } from "./theme-context";
import styles from "./Header.module.css";

interface HeaderProps {
  readonly onSidebarToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle }) => {
  const { mode, toggle } = useTheme();

  return (
    <header className={styles.bar}>
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
          <svg className={styles.logo} width="22" height="22" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="6" fill="currentColor" />
            <path
              d="M7 22V10h3v12H7zm5-4V10h3v8h-3zm5 2V10h3v10h-3zm5-6V10h3v4h-3z"
              fill={mode === "dark" ? "#18181b" : "#fff"}
            />
          </svg>
          <span className={styles.name}>react-use-echarts</span>
        </Link>
      </div>
      <div className={styles.right}>
        <a
          className="btn"
          href="https://github.com/chensid/react-use-echarts"
          target="_blank"
          rel="noreferrer"
        >
          <Icon name="github" size={16} />
          GitHub
        </a>
        <button
          type="button"
          className="btn"
          onClick={toggle}
          aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <Icon name={mode === "dark" ? "sun" : "moon"} size={15} />
        </button>
      </div>
    </header>
  );
};

export default Header;
