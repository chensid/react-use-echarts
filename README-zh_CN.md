# react-use-echarts

> [中文](./README-zh_CN.md) | [English](./README.md)

[![NPM version](https://img.shields.io/npm/v/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![NPM downloads](https://img.shields.io/npm/dm/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![CI](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml/badge.svg)](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/chensid/react-use-echarts/graph/badge.svg)](https://codecov.io/gh/chensid/react-use-echarts)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/chensid/react-use-echarts/npm-publish.yml)](https://github.com/chensid/react-use-echarts/actions/workflows/npm-publish.yml)
[![GitHub issues](https://img.shields.io/github/issues/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/pulls)
[![GitHub license](https://img.shields.io/github/license/chensid/react-use-echarts.svg)](https://github.com/chensid/react-use-echarts/blob/main/LICENSE.txt)

React Hooks & 组件，用于 Apache ECharts — TypeScript、自动 resize、主题、懒加载。

## 特性

- **Hook + 组件** — 使用 `useEcharts` Hook 或声明式 `<EChart />` 组件
- **TypeScript 优先** — 完整的类型定义，支持 IDE 自动补全
- **零依赖** — 除 peer 依赖外无运行时依赖
- **自动 resize** — 通过 ResizeObserver 自动处理容器尺寸变化
- **主题** — 内置 light、dark、macarons 主题，支持任意自定义主题
- **图表联动** — 连接多个图表实现同步交互
- **懒加载** — 图表进入视口时才初始化
- **StrictMode 安全** — 实例缓存基于引用计数，正确处理双重挂载/卸载

## 环境要求

- React 19+（`react` + `react-dom`）
- ECharts 6.x

> **注意**：仅支持 CSR。ECharts 需要 DOM 访问，不支持 SSR。

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

通过 `ref` 可访问 `{ setOption, getInstance, resize }` 命令式方法。

### `useEcharts` Hook

需要完全控制时，直接使用 Hook：

```tsx
import { useRef } from "react";
import { useEcharts } from "react-use-echarts";

function MyChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const { setOption, getInstance, resize } = useEcharts(chartRef, {
    option: { series: [{ type: "line", data: [150, 230, 224, 218, 135] }] },
  });
  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
}
```

## 使用示例

### 主题

内置主题需在应用入口注册一次：

```tsx
import { registerBuiltinThemes } from "react-use-echarts/themes/registry";
registerBuiltinThemes();

// 内置主题
useEcharts(chartRef, { option, theme: "dark" });

// 任意通过 echarts.registerTheme 注册的主题
useEcharts(chartRef, { option, theme: "vintage" });

// 自定义主题对象（使用 useMemo 保持引用稳定）
const customTheme = useMemo(() => ({ color: ["#fc8452", "#9a60b4", "#ea7ccc"] }), []);
useEcharts(chartRef, { option, theme: customTheme });
```

### 事件处理

支持简写（函数）和完整配置（带 query/context 的对象）两种写法：

```tsx
useEcharts(chartRef, {
  option,
  onEvents: {
    click: (params) => console.log("Clicked:", params),
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
  loadingOption: { text: "加载中..." },
});
```

### 图表联动

为多个图表指定相同的 `group` ID，tooltip、highlight 等交互将自动同步：

```tsx
useEcharts(chartRef1, { option: option1, group: "dashboard" });
useEcharts(chartRef2, { option: option2, group: "dashboard" });
```

### 懒加载

延迟初始化图表，直到元素滚动进入视口：

```tsx
useEcharts(chartRef, { option, lazyInit: true });

// 自定义 IntersectionObserver 配置
useEcharts(chartRef, {
  option,
  lazyInit: { rootMargin: "200px", threshold: 0.5 },
});
```

## API 参考

### `<EChart />` Props

封装了 `useEcharts` 的声明式组件。接受所有 Hook 选项作为 props，另外支持：

| Prop        | 类型                    | 默认值                              | 说明                                      |
| ----------- | ----------------------- | ----------------------------------- | ----------------------------------------- |
| `style`     | `React.CSSProperties`   | `{ width: '100%', height: '100%' }` | 容器样式（与默认样式合并）                |
| `className` | `string`                | —                                   | 容器 CSS 类名                             |
| `ref`       | `Ref<UseEchartsReturn>` | —                                   | 暴露 `{ setOption, getInstance, resize }` |

### `useEcharts(ref, options)`

#### Options

| 选项            | 类型                                  | 默认值     | 说明                                                                                   |
| --------------- | ------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| `option`        | `EChartsOption`                       | （必需）   | ECharts 配置选项                                                                       |
| `theme`         | `string \| object \| null`            | `null`     | 任意已注册主题名或自定义主题对象                                                       |
| `renderer`      | `'canvas' \| 'svg'`                   | `'canvas'` | 渲染器类型                                                                             |
| `lazyInit`      | `boolean \| IntersectionObserverInit` | `false`    | 基于 IntersectionObserver 的懒加载                                                     |
| `group`         | `string`                              | —          | 图表联动组 ID                                                                          |
| `setOptionOpts` | `SetOptionOpts`                       | —          | `setOption` 的默认选项                                                                 |
| `showLoading`   | `boolean`                             | `false`    | 是否显示加载指示器                                                                     |
| `loadingOption` | `object`                              | —          | 加载指示器配置                                                                         |
| `onEvents`      | `EChartsEvents`                       | —          | 事件处理器（`fn` 或 `{ handler, query?, context? }`）                                  |
| `autoResize`    | `boolean`                             | `true`     | 通过 ResizeObserver 自动 resize                                                        |
| `initOpts`      | `EChartsInitOpts`                     | —          | 传递给 `echarts.init()`（devicePixelRatio、locale 等）                                 |
| `onError`       | `(error: unknown) => void`            | —          | 错误处理回调 — 未提供时 effect 内失败走 `console.error`，命令式 `setOption` 则直接抛出 |

#### 返回值

| 方法          | 类型                                                    | 说明                |
| ------------- | ------------------------------------------------------- | ------------------- |
| `setOption`   | `(option: EChartsOption, opts?: SetOptionOpts) => void` | 动态更新图表配置    |
| `getInstance` | `() => ECharts \| undefined`                            | 获取 ECharts 实例   |
| `resize`      | `() => void`                                            | 手动触发图表 resize |

### 其他导出

```tsx
import { useLazyInit } from "react-use-echarts"; // 独立的懒加载 Hook
import { isBuiltinTheme, registerCustomTheme } from "react-use-echarts"; // 主题工具（不含 JSON）
import { registerBuiltinThemes } from "react-use-echarts/themes/registry"; // 内置主题 JSON（~20KB）

// 所有导出类型：UseEchartsOptions, UseEchartsReturn, EChartProps,
// EChartsEvents, EChartsEventConfig, EChartsInitOpts, BuiltinTheme, LoadingOption
// EChartsOption 和 SetOptionOpts 来自 "echarts" 包。
```

## 贡献

我们欢迎所有贡献。请先阅读[贡献指南](CONTRIBUTING.md)。

## 更新日志

每个版本的详细变更请查看[发布说明](https://github.com/chensid/react-use-echarts/releases)。

## 许可证

[MIT](./LICENSE.txt) © [Ethan](https://github.com/chensid)
