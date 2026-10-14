import pkg from "../../package.json";

const majorOf = (range: string | undefined): string => {
  if (!range) return "";
  const m = /(\d+)/.exec(range);
  return m?.[1] ?? range;
};

// Major.minor floor of a peer range, e.g. "^19.2.0" → "19.2".
const minorOf = (range: string | undefined): string => {
  if (!range) return "";
  const m = /(\d+\.\d+)/.exec(range);
  return m?.[1] ?? range;
};

export const APP_VERSION = pkg.version;
export const REACT_MIN = minorOf(pkg.peerDependencies?.react);
export const ECHARTS_MAJOR = majorOf(pkg.peerDependencies?.echarts);

// Measured consumer-minified size of the full barrel (min+gzip): the production
// build `dist/index.js` (the `default` export condition, not `dist/development/`)
// after `vp pack`, minified with rolldown's oxc `minifySync` (compress + mangle),
// then gzipped. 4,074 B at 3.3.0. Re-measure the same way and update on significant
// surface changes. Quoted once here so hero/stats/compare can't drift.
export const BUNDLE_SIZE = "4.1 kB";
