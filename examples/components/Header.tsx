import React from "react";
import styles from "./Header.module.css";

export type ThemeMode = "light" | "dark";

interface HeaderProps {
  readonly themeMode: ThemeMode;
  readonly onThemeToggle: () => void;
  readonly onSidebarToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ themeMode, onThemeToggle, onSidebarToggle }) => {
  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.burger}
          onClick={onSidebarToggle}
          aria-label="Toggle navigation"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M3 5h12M3 9h12M3 13h12" />
          </svg>
        </button>
        <svg className={styles.logo} width="22" height="22" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="6" fill="currentColor" />
          <path
            d="M7 22V10h3v12H7zm5-4V10h3v8h-3zm5 2V10h3v10h-3zm5-6V10h3v4h-3z"
            fill={themeMode === "dark" ? "#18181b" : "#fff"}
          />
        </svg>
        <span className={styles.name}>react-use-echarts</span>
      </div>
      <div className={styles.right}>
        <a
          className="btn"
          href="https://github.com/chensid/react-use-echarts"
          target="_blank"
          rel="noreferrer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          GitHub
        </a>
        <button
          type="button"
          className="btn"
          onClick={onThemeToggle}
          aria-label={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {themeMode === "dark" ? (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
