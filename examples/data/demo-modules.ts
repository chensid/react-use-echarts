import React from "react";

// Every demo module, keyed by its path relative to this file
// ("../gallery/BarChart.tsx"). The rendered component and the Code tab's raw
// source are looked up under the same key, so a demo, its shown source and its
// GitHub link can never point at different files.
const loaders = import.meta.glob<{ default: React.ComponentType }>([
  "../gallery/*.tsx",
  "../features/*.tsx",
]);
const sources = import.meta.glob<string>(["../gallery/*.tsx", "../features/*.tsx"], {
  query: "?raw",
  import: "default",
});

export interface DemoModule {
  readonly component: React.LazyExoticComponent<React.ComponentType>;
  readonly source: () => Promise<string>;
  readonly sourcePath: string;
}

/** `file` is relative to `examples/`, e.g. `"gallery/BarChart.tsx"`. */
export const demoModule = (file: string): DemoModule => {
  const key = `../${file}`;
  const load = loaders[key];
  const source = sources[key];
  if (!load || !source) throw new Error(`Unknown demo module: examples/${file}`);
  return { component: React.lazy(load), source, sourcePath: `examples/${file}` };
};
