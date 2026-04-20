import pkg from "../../package.json";

const majorOf = (range: string | undefined): string => {
  if (!range) return "";
  const m = /(\d+)/.exec(range);
  return m ? m[1] : range;
};

export const APP_VERSION = pkg.version;
export const REACT_MAJOR = majorOf(pkg.peerDependencies?.react);
export const ECHARTS_MAJOR = majorOf(pkg.peerDependencies?.echarts);
