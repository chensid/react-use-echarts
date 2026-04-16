import { createContext, useContext } from "react";

export type ThemeMode = "light" | "dark";

export interface ThemeContextValue {
  readonly mode: ThemeMode;
  readonly toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
