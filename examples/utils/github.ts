const REPO = "chensid/react-use-echarts";
const BRANCH = "main";

export function githubUrl(sourcePath: string): string {
  return `https://github.com/${REPO}/blob/${BRANCH}/${sourcePath}`;
}
