import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext, type ThemeMode } from "./theme-context";

const STORAGE_KEY = "rce-theme";

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "dark" || v === "light") return v;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const ThemeProvider: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const toggle = useCallback(() => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(() => ({ mode, toggle }), [mode, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
