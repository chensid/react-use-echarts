import React from "react";
import ThemeSwitcher from "./ThemeSwitcher";

const ThemeExamples: React.FC = () => {
  return (
    <div style={{ padding: "16px" }}>
      <h1>Theme Examples</h1>
      <div>
        <h2>Theme Switcher</h2>
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default ThemeExamples;
