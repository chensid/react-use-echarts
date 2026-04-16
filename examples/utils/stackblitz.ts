const REPO = "chensid/react-use-echarts";
const BRANCH = "main";

export function githubUrl(sourcePath: string): string {
  return `https://github.com/${REPO}/blob/${BRANCH}/${sourcePath}`;
}

export function stackblitzUrl(sourcePath: string): string {
  const encoded = encodeURIComponent(sourcePath);
  return `https://stackblitz.com/github/${REPO}/tree/${BRANCH}?file=${encoded}`;
}
