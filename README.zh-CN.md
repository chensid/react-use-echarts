# react-use-echarts

> [中文](./README.zh-CN.md) | [English](./README.md)

[![NPM version](https://img.shields.io/npm/v/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![NPM downloads](https://img.shields.io/npm/dm/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![CI](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml/badge.svg)](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/chensid/react-use-echarts/graph/badge.svg)](https://codecov.io/gh/chensid/react-use-echarts)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/chensid/react-use-echarts/npm-publish.yml)](https://github.com/chensid/react-use-echarts/actions/workflows/npm-publish.yml)
[![GitHub issues](https://img.shields.io/github/issues/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/pulls)
[![GitHub license](https://img.shields.io/github/license/chensid/react-use-echarts.svg)](https://github.com/chensid/react-use-echarts/blob/main/LICENSE.txt)

一个用于 Apache ECharts 的 React Hooks 库，提供完整的 TypeScript 支持。简单、轻量，不干扰你的工作流。

## 特性

- **Hook + 组件** — 使用 `useEcharts` Hook 或声明式 `<EChart />` 组件
- **TypeScript 优先** — 使用 TypeScript 编写，提供完整的类型定义
- **零依赖** — 除 peer 依赖 `react`、`react-dom`、`echarts` 外无运行时依赖
- **自动 resize** — 通过 ResizeObserver 自动处理容器尺寸变化
- **主题** — 内置 light、dark、macarons 主题，支持自定义主题
- **图表联动** — 连接多个图表实现同步交互
- **懒加载** — 图表进入视口时才初始化
- **事件处理** — 灵活的事件系统，支持简写和完整配置模式
- **加载状态** — 内置 loading 指示器管理
- **错误处理** — 支持可选 `onError` 回调，并提供可预期的兜底行为
- **StrictMode 安全** — 实例缓存基于引用计数，正确处理双重挂载/卸载

## 环境要求

- React 19.2+（`react` + `react-dom`）
- ECharts 6.x

> **注意**：此库仅适用于客户端渲染（CSR）。由于 ECharts 需要 DOM 访问，不支持服务端渲染（SSR）。

## 安装

```bash
npm install react-use-echarts echarts
# 或
yarn add react-use-echarts echarts
# 或
pnpm add react-use-echarts echarts
```

## 快速开始

### `<EChart />` 组件

最简单的用法 — 无需手动管理 ref：

```tsx
import { EChart } from "react-use-echarts";

function MyChart() {
  return (
    <EChart
      option={{
        xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
        yAxis: { type: "value" },
        series: [{ data: [150, 230, 224, 218, 135], type: "line" }],
      }}
    />
  );
}
```

### `useEcharts` Hook

需要完全控制时，直接使用 Hook：

```tsx
import { useRef } from "react";
import { useEcharts } from "react-use-echarts";

function MyChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  const { setOption, getInstance, resize } = useEcharts(chartRef, {
    option: {
      xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
      yAxis: { type: "value" },
      series: [{ data: [150, 230, 224, 218, 135], type: "line" }],
    },
  });

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
}
```

## 使用示例

### 事件处理

支持简写（函数）和完整配置（带 query/context 的对象）两种写法：

```tsx
useEcharts(chartRef, {
  option,
  onEvents: {
    // 简写 — 直接传函数
    click: (params) => console.log("Clicked:", params),
    // 完整配置 — 需要 query 或 context 时使用
    mouseover: {
      handler: (params) => console.log("Hover:", params),
      query: "series",
    },
  },
});
```

### 加载状态

```tsx
const [loading, setLoading] = useState(true);

useEcharts(chartRef, {
  option,
  showLoading: loading,
  loadingOption: { text: "加载中..." }, // 可选
});
```

### 主题

内置主题：`light`、`dark`、`macarons`。也可传入自定义主题对象：

```tsx
// 内置主题
useEcharts(chartRef, { option, theme: "dark" });

// 自定义主题对象（使用 useMemo 保持引用稳定）
const customTheme = useMemo(
  () => ({
    color: ["#fc8452", "#9a60b4", "#ea7ccc"],
    backgroundColor: "#1e1e1e",
  }),
  [],
);

useEcharts(chartRef, { option, theme: customTheme });
```

### 图表联动

为多个图表指定相同的 `group` ID，tooltip、highlight 等交互将自动同步：

```tsx
useEcharts(chartRef1, { option: option1, group: "dashboard" });
useEcharts(chartRef2, { option: option2, group: "dashboard" });
```

### 懒加载

延迟初始化图表，直到元素滚动进入视口。适合包含大量图表的页面：

```tsx
// 使用默认配置（rootMargin: '50px', threshold: 0.1）
useEcharts(chartRef, { option, lazyInit: true });

// 自定义 IntersectionObserver 配置
useEcharts(chartRef, { option, lazyInit: { rootMargin: "200px", threshold: 0.5 } });
```

### SVG 渲染器

```tsx
useEcharts(chartRef, { option, renderer: "svg" });
```

### 访问 ECharts 实例

通过 `getInstance()` 执行导出图片等高级操作：

```tsx
const { getInstance } = useEcharts(chartRef, { option });

const exportImage = () => {
  const instance = getInstance();
  if (instance) {
    const url = instance.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#fff" });
    const link = document.createElement("a");
    link.download = "chart.png";
    link.href = url;
    link.click();
  }
};
```

### 错误处理

```tsx
useEcharts(chartRef, {
  option,
  onError: (error) => console.error("图表错误:", error),
});
```

未提供 `onError` 时：初始化 / 首次 `setOption` 失败会通过 `console.error` 输出；后续 option 更新或命令式 `setOption` 失败会直接抛出异常。

### 通过组件 Ref 访问方法

通过 ref 获取 Hook 返回值：

```tsx
import { useRef } from "react";
import { EChart } from "react-use-echarts";
import type { UseEchartsReturn } from "react-use-echarts";

function MyChart() {
  const chartRef = useRef<UseEchartsReturn>(null);

  return (
    <div>
      <button onClick={() => chartRef.current?.resize()}>Resize</button>
      <EChart ref={chartRef} option={option} style={{ height: "600px" }} className="my-chart" />
    </div>
  );
}
```

## API 参考

### `<EChart />` Props

封装了 `useEcharts` 的声明式组件。接受所有 Hook 选项作为 props，另外支持：

| Prop        | 类型                    | 默认值                               | 说明                                      |
| ----------- | ----------------------- | ------------------------------------ | ----------------------------------------- |
| `style`     | `React.CSSProperties`   | `{ width: '100%', height: '400px' }` | 容器样式（与默认样式合并）                |
| `className` | `string`                | —                                    | 容器 CSS 类名                             |
| `ref`       | `Ref<UseEchartsReturn>` | —                                    | 暴露 `{ setOption, getInstance, resize }` |

### `useEcharts(ref, options)`

#### Options

| 选项            | 类型                                                | 默认值     | 说明                                                   |
| --------------- | --------------------------------------------------- | ---------- | ------------------------------------------------------ |
| `option`        | `EChartsOption`                                     | （必需）   | ECharts 配置选项                                       |
| `theme`         | `'light' \| 'dark' \| 'macarons' \| object \| null` | `null`     | 主题名称或自定义主题对象                               |
| `renderer`      | `'canvas' \| 'svg'`                                 | `'canvas'` | 渲染器类型                                             |
| `lazyInit`      | `boolean \| IntersectionObserverInit`               | `false`    | 基于 IntersectionObserver 的懒加载                     |
| `group`         | `string`                                            | —          | 图表联动组 ID                                          |
| `setOptionOpts` | `SetOptionOpts`                                     | —          | `setOption` 的默认选项                                 |
| `showLoading`   | `boolean`                                           | `false`    | 是否显示加载指示器                                     |
| `loadingOption` | `object`                                            | —          | 加载指示器配置                                         |
| `onEvents`      | `EChartsEvents`                                     | —          | 事件处理器（`fn` 或 `{ handler, query?, context? }`）  |
| `autoResize`    | `boolean`                                           | `true`     | 通过 ResizeObserver 自动 resize                        |
| `initOpts`      | `EChartsInitOpts`                                   | —          | 传递给 `echarts.init()`（devicePixelRatio、locale 等） |
| `onError`       | `(error: unknown) => void`                          | —          | init/setOption 操作的错误处理回调                      |

#### 返回值

| 方法          | 类型                                                    | 说明                |
| ------------- | ------------------------------------------------------- | ------------------- |
| `setOption`   | `(option: EChartsOption, opts?: SetOptionOpts) => void` | 动态更新图表配置    |
| `getInstance` | `() => ECharts \| undefined`                            | 获取 ECharts 实例   |
| `resize`      | `() => void`                                            | 手动触发图表 resize |

### `useLazyInit(ref, options)`

独立的懒加载 Hook，基于 IntersectionObserver。

```tsx
import { useLazyInit } from "react-use-echarts";

const isInView = useLazyInit(elementRef, true); // 或传入 IntersectionObserverInit
```

返回 `boolean` — 元素进入视口后为 `true`（若 `options` 为 `false` 则立即返回 `true`）。

### 主题工具

```tsx
import {
  getAvailableThemes, // () => ['light', 'dark', 'macarons']
  isBuiltinTheme, // (name: string) => boolean
  getBuiltinTheme, // (name: BuiltinTheme) => object | null
  registerCustomTheme, // (name: string, config: object) => void
  registerBuiltinThemes, // () => void — 手动注册（通常无需调用）
  ensureBuiltinThemesRegistered, // () => void — 幂等，初始化前自动调用
} from "react-use-echarts";
```

### 高级工具

实例缓存与组联动工具，用于高级场景：

```tsx
import {
  // 实例缓存 — 基于 WeakMap + 引用计数
  getCachedInstance, // (element) => ECharts | undefined
  setCachedInstance, // (element, instance) => ECharts
  replaceCachedInstance, // (element, instance) => ECharts
  releaseCachedInstance, // (element) => void
  getReferenceCount, // (element) => number
  clearInstanceCache, // () => void

  // 组联动 — 手动管理图表分组
  addToGroup, // (instance, groupId) => void
  removeFromGroup, // (instance, groupId) => void
  updateGroup, // (instance, oldGroupId?, newGroupId?) => void
  getGroupInstances, // (groupId) => ECharts[]
  getInstanceGroup, // (instance) => string | undefined
  isInGroup, // (instance) => boolean
  clearGroups, // () => void
} from "react-use-echarts";
```

### 导出类型

```tsx
import type {
  UseEchartsOptions,
  UseEchartsReturn,
  EChartProps,
  EChartsEvents,
  EChartsEventConfig,
  EChartsInitOpts,
  BuiltinTheme,
} from "react-use-echarts";
```

## 开发（Vite+）

仓库开发流程已对齐 Vite+ 工具链：

- `vp install` — 安装依赖（按 `packageManager` 自动委派，当前为 pnpm）
- `vp dev` — 启动 examples 开发服务（`http://localhost:3000`）
- `vp check` — 一次执行 format + lint + typecheck
- `vp test run --coverage` — 执行测试并生成覆盖率
- `vp pack` — 构建库产物到 `dist/`

`package.json` 中核心工具也映射到了 Vite+ 包：

- `vite` → `@voidzero-dev/vite-plus-core`
- `vitest` → `@voidzero-dev/vite-plus-test`

CI 和发布工作流同样使用 `voidzero-dev/setup-vp` + `vp` 命令完成安装、检查与构建。

## 贡献

我们欢迎所有贡献。请先阅读[贡献指南](CONTRIBUTING.md)。你可以通过 [Pull Request](https://github.com/chensid/react-use-echarts/pulls) 或 [GitHub Issues](https://github.com/chensid/react-use-echarts/issues) 提交想法。

## 更新日志

每个版本的详细变更请查看[发布说明](https://github.com/chensid/react-use-echarts/releases)。

## 许可证

[MIT](./LICENSE.txt) © [Ethan](https://github.com/chensid)
