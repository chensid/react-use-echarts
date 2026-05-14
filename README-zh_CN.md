# react-use-echarts

> [中文](./README-zh_CN.md) | [English](./README.md)

[![NPM version](https://img.shields.io/npm/v/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![NPM downloads](https://img.shields.io/npm/dm/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![CI](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml/badge.svg)](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/chensid/react-use-echarts/graph/badge.svg)](https://codecov.io/gh/chensid/react-use-echarts)
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
- Node.js 22+（仅构建/SSR 框架层面需要；发布产物是浏览器 ESM）

> **仅支持 CSR。** ECharts 需要真实 DOM，不支持 SSR。
>
> **1.3.0 起仅提供 ESM。** 只发布单份 ESM 产物（`dist/index.js`）。所有现代打包工具（Vite、Next.js、webpack 5+、Rspack、Parcel、Turbopack）和 Node 22+（`require(ESM)`）均可直接消费。如仍依赖 CJS-only 工具链，请固定在 `1.2.x`。

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

`<EChart />` 默认使用 `width: 100%` 和 `height: 100%`，因此父容器仍然需要显式高度。

通过 `ref` 可访问命令式 API —— 完整列表见 [返回值](#返回值)（`setOption`、`dispatchAction`、`clear`、`resize`、`appendData`、`getDataURL`、`convertToPixel` 等）。

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

图表容器必须有明确尺寸，例如 `style={{ width: "100%", height: "400px" }}`。

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

### 使用 `/core` 子入口做 Tree-shaking

默认入口 `react-use-echarts` 会副作用 import `"echarts"`，自动注册全部图表与组件，新手开箱即用，但会把整个 ECharts（约 290KB gzip）打入产物。生产环境只用到少量图表类型时，推荐使用 `react-use-echarts/core` 子入口——它跳过这一副作用，由你自己按需注册：

```tsx
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

import { useEcharts, EChart } from "react-use-echarts/core";
// 公开 API 与默认入口完全一致，只是 import 路径不同。
```

两个入口共享同一套 API，选择 `/core` 时打包器会把未使用的 ECharts 模块 tree-shake 掉。内置主题仍通过 `react-use-echarts/themes/registry` 注册。

> ECharts 维护单一全局 registry，因此 `echarts.use([...])` 调用会跨模块叠加——每种图表类型在应用中任意位置 `use()` 一次即可。

### 在 Next.js（App Router）中使用

包入口与 `themes/registry` 已标注 `"use client"`，因此即便在 React
Server Component 中 import 也不会把 ECharts 打入 server bundle。把图表
封装到自己的客户端组件里，再从任意 Server Component 直接 import：

```tsx
// app/components/MyChart.tsx
"use client";
import { EChart } from "react-use-echarts";

export function MyChart() {
  return <EChart option={{ series: [{ type: "line", data: [1, 2, 3] }] }} />;
}
```

```tsx
// app/page.tsx（Server Component）—— 直接 import 客户端组件
import { MyChart } from "./components/MyChart";

export default function Page() {
  return <MyChart />;
}
```

> **仅 Pages Router：** 如果需要在 `getServerSideProps` / `getStaticProps`
> 的页面中强制仅在客户端渲染，可使用
> `dynamic(() => import("./components/MyChart").then((m) => m.MyChart), { ssr: false })`。
> 在 **App Router** 中，Server Component 不允许使用 `next/dynamic` 配合
> `ssr: false`——`"use client"` 指令已经能处理同样的需求。

## 注意事项

- **容器必须有明确尺寸** — 高度为 0 时图表不可见；请为容器设置 `height`（以及 `width` 如果不是 100%）。
- **`onEvents` 引用应保持稳定** — 每次渲染传入新的 `onEvents` 对象会触发全量重新绑定。使用 `useMemo` 缓存（或提升到模块级）。
- **不要让多个 `useEcharts` 共享同一个 DOM 元素** — 实例缓存会复用同一个 ECharts 实例并在开发模式下打印警告；多个 hook 的更新会互相覆盖。
- **`initOpts` 和自定义 `theme` 对象引用变化会重建实例** — 传递 memoized 对象或模块级常量，除非确实需要重建。
- **StrictMode 安全** — 双挂载/卸载由带引用计数的实例缓存正确处理。

## API 参考

### `<EChart />` Props

封装了 `useEcharts` 的声明式组件。接受所有 Hook 选项作为 props，另外支持：

| Prop        | 类型                    | 默认值                              | 说明                                         |
| ----------- | ----------------------- | ----------------------------------- | -------------------------------------------- |
| `style`     | `React.CSSProperties`   | `{ width: '100%', height: '100%' }` | 容器样式（与默认样式合并）                   |
| `className` | `string`                | —                                   | 容器 CSS 类名                                |
| `ref`       | `Ref<UseEchartsReturn>` | —                                   | 暴露完整的命令式 API（见 [返回值](#返回值)） |

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

> 优先使用声明式 props（`option`、`theme`、`showLoading` 等），命令式方法仅在 props 未覆盖的场景下使用——例如导出图片、坐标转换、流式追加等。
> 实例未初始化时所有方法均为 no-op 或返回安全默认值。实例抛出错误时：提供 `onError` 时路由错误并返回默认值；未提供 `onError` 时直接重新抛出（读取方法亦同，不会回退到 `console.error`）。

**生命周期 / 更新**

| 方法             | 类型                                                                                 | 说明                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `setOption`      | `(option: EChartsOption, opts?: SetOptionOpts) => void`                              | 动态更新图表配置                                                                                                     |
| `dispatchAction` | `(payload: Payload, opt?: boolean \| { silent?: boolean; flush?: boolean }) => void` | 派发 ECharts 动作（`highlight`、`downplay`、`showTip` 等）                                                           |
| `clear`          | `() => void`                                                                         | 清空当前图表内容                                                                                                     |
| `resize`         | `(opts?: ResizeOpts) => void`                                                        | 手动触发 resize；`ResizeOpts` 支持 `width`/`height`/`animation`/`silent`                                             |
| `appendData`     | `(params: { seriesIndex: number; data: ArrayLike<unknown> }) => void`                | 向 series 流式追加数据。带漂移感知：会清掉去重缓存，使下次浅相等但新引用的 `option` rerender 重新调用 setOption 同步 |

**读取 / 内省**

| 方法          | 类型                               | 说明                                                |
| ------------- | ---------------------------------- | --------------------------------------------------- |
| `getInstance` | `() => ECharts \| undefined`       | 获取 ECharts 实例                                   |
| `getOption`   | `() => EChartsOption \| undefined` | 获取当前合并后的完整配置                            |
| `getWidth`    | `() => number \| undefined`        | 容器宽度（像素）                                    |
| `getHeight`   | `() => number \| undefined`        | 容器高度（像素）                                    |
| `getDom`      | `() => HTMLElement \| undefined`   | 底层 DOM 容器节点                                   |
| `isDisposed`  | `() => boolean`                    | 实例是否已销毁；未初始化时返回 `true`（视作已销毁） |

**导出**

| 方法                  | 类型                                                       | 说明                                           |
| --------------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| `getDataURL`          | `(opts?) => string \| undefined`                           | 图片 base64 data URL（`png` / `jpeg` / `svg`） |
| `getConnectedDataURL` | `(opts?) => string \| undefined`                           | 同组所有图表合成的图片                         |
| `renderToSVGString`   | `(opts?: { useViewBox?: boolean }) => string \| undefined` | 渲染为 SVG 字符串（配合 SVG renderer 使用）    |
| `getSvgDataURL`       | `() => string \| undefined`                                | 当前图表的 SVG data URL                        |

**坐标转换**

| 方法               | 类型                                                                                                    | 说明                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `convertToPixel`   | `(finder: ChartFinder, value: ChartScaleValue \| ChartScaleValue[]) => number \| number[] \| undefined` | 逻辑坐标 → 像素坐标                                  |
| `convertFromPixel` | `(finder: ChartFinder, value: number \| number[]) => number \| number[] \| undefined`                   | 像素坐标 → 逻辑坐标                                  |
| `containPixel`     | `(finder: ChartFinder, value: number[]) => boolean`                                                     | 像素点是否落在指定组件内（实例未初始化时返回 false） |

`ChartFinder` 为 `string | { seriesIndex?, seriesId?, …, geoIndex?, … }` —— 字符串简写或查询对象。`ChartScaleValue` 为 `number | string | Date`。

### 其他导出

```tsx
import { useLazyInit } from "react-use-echarts"; // 独立的懒加载 Hook
import { isBuiltinTheme, registerCustomTheme } from "react-use-echarts"; // 主题工具（不含 JSON）
import { registerBuiltinThemes } from "react-use-echarts/themes/registry"; // 内置主题 JSON（~20KB）
import { useEcharts, EChart } from "react-use-echarts/core"; // tree-shakable 子入口（见使用示例）

// 所有导出类型：UseEchartsOptions, UseEchartsReturn, EChartProps,
// EChartsEvents, EChartsEventConfig, EChartsEventHandler, EChartsInitOpts,
// BuiltinTheme, LoadingOption, ChartFinder, ChartScaleValue, Payload
// EChartsOption、SetOptionOpts、ResizeOpts 来自 "echarts" 包。
```

## 从 `echarts-for-react` 迁移

绝大多数 prop 是 1:1 对应，少数被并入现有选项。速查表：

| `echarts-for-react`       | `react-use-echarts`                       | 说明                                                                                                                        |
| ------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `option`                  | `option`                                  | 一致                                                                                                                        |
| `theme`                   | `theme`                                   | 一致；内置主题需先调用 `registerBuiltinThemes()`（见[主题](#主题)）                                                         |
| `notMerge` / `lazyUpdate` | `setOptionOpts: { notMerge, lazyUpdate }` | 合并为单个对象传给 `setOption`                                                                                              |
| `showLoading`             | `showLoading`                             | 一致                                                                                                                        |
| `loadingOption`           | `loadingOption`                           | 一致                                                                                                                        |
| `onEvents`                | `onEvents`                                | 形态一致；也可写 `{ handler, query?, context? }` 进行 query/context 绑定                                                    |
| `onChartReady`            | 改用命令式 API                            | 通过 hook 返回的 `getInstance()`（或 `ref.current`）读取——首次初始化后就绪                                                  |
| `opts.renderer`           | `renderer: 'canvas' \| 'svg'`             | 提升为顶层字段                                                                                                              |
| `opts`（其他字段）        | `initOpts`                                | 形态一致（`devicePixelRatio`、`locale`、`width`、`height`、`useDirtyRect` 等）                                              |
| `style`                   | `style`                                   | `<EChart />` 默认 `{ width: '100%', height: '100%' }`，父容器仍需显式高度                                                   |
| `className`               | `className`                               | 一致                                                                                                                        |
| `lazyUpdate`（顶层）      | `setOptionOpts: { lazyUpdate: true }`     | 见 `notMerge` 行                                                                                                            |
| `shouldSetOption`         | 在父组件中自行控制 `option`               | 顶层键自动经 `shallowEqual` 去重；如需自定义判断（深比较、节流、按应用状态门控），请在父组件中 memoize 或跳过 `option` prop |
| `autoResize`（4.x）       | `autoResize`                              | 默认值同为 `true`；底层使用 ResizeObserver + RAF                                                                            |
| _无_                      | `lazyInit`                                | 新增：容器进入视口时再初始化                                                                                                |
| _无_                      | `group`                                   | 新增：通过组 ID 实现图表联动                                                                                                |
| _无_                      | `onError`                                 | 新增：将 init / setOption / dispatchAction 错误路由到回调                                                                   |

并排示例：

```tsx
// echarts-for-react
<ReactECharts
  option={option}
  theme="dark"
  notMerge
  lazyUpdate
  opts={{ renderer: "svg", devicePixelRatio: 2 }}
  onEvents={{ click: handleClick }}
  showLoading={loading}
  onChartReady={(instance) => instanceRef.current = instance}
/>

// react-use-echarts
<EChart
  ref={chartRef}
  option={option}
  theme="dark"
  setOptionOpts={{ notMerge: true, lazyUpdate: true }}
  renderer="svg"
  initOpts={{ devicePixelRatio: 2 }}
  onEvents={{ click: handleClick }}
  showLoading={loading}
/>
// chartRef.current?.getInstance() 替代 onChartReady
```

## 贡献

我们欢迎所有贡献。请先阅读[贡献指南](CONTRIBUTING.md)。

## 更新日志

每个版本的详细变更请查看[发布说明](https://github.com/chensid/react-use-echarts/releases)。

## 许可证

[MIT](./LICENSE.txt) © [Ethan](https://github.com/chensid)
