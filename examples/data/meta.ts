import pkg from "../../package.json";

const majorOf = (range: string | undefined): string => {
  if (!range) return "";
  const m = /(\d+)/.exec(range);
  return m?.[1] ?? range;
};

export const APP_VERSION = pkg.version;
export const REACT_MAJOR = majorOf(pkg.peerDependencies?.react);
export const ECHARTS_MAJOR = majorOf(pkg.peerDependencies?.echarts);

// Measured consumer-minified size of the full barrel (min+gzip); re-measure and
// update on significant surface changes. Quoted once here so hero/stats/compare can't drift.
export const BUNDLE_SIZE = "3.8 kB";
