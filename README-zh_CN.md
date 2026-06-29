# react-use-echarts

> [中文](./README-zh_CN.md) | [English](./README.md)

[![NPM version](https://img.shields.io/npm/v/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![NPM downloads](https://img.shields.io/npm/dm/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![CI](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml/badge.svg)](https://github.com/chensid/react-use-echarts/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/chensid/react-use-echarts/graph/badge.svg)](https://codecov.io/gh/chensid/react-use-echarts)
[![GitHub issues](https://img.shields.io/github/issues/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/pulls)
[![GitHub license](https://img.shields.io/github/license/chensid/react-use-echarts.svg)](https://github.com/chensid/react-use-echarts/blob/main/LICENSE.txt)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/react-use-echarts?label=minzipped)](https://bundlephobia.com/package/react-use-echarts)
[![types included](https://img.shields.io/npm/types/react-use-echarts)](https://www.npmjs.com/package/react-use-echarts)

React Hooks & 组件，用于 Apache ECharts — TypeScript、自动 resize、主题、懒加载。

**[📊 在线 Demo 与交互式 Playground →](https://chensid.github.io/react-use-echarts/)**

[![react-use-echarts —— 面向 Apache ECharts 的极简 Hook](https://raw.githubusercontent.com/chensid/react-use-echarts/main/.github/assets/hero.webp)](https://chensid.github.io/react-use-echarts/)

## 特性

- **Hook + 组件** — 使用 `useEcharts` Hook 或声明式 `<EChart />` 组件
- **TypeScript 优先** — 完整的类型定义，支持 IDE 自动补全
- **零依赖** — 除 peer 依赖外无运行时依赖
- **自动 resize** — 通过 ResizeObserver 自动处理容器尺寸变化
- **主题** — 内置 light、dark、macarons 主题，支持任意自定义主题
- **图表联动** — 连接多个图表实现同步交互
- **懒加载** — 图表进入视口时才初始化
- **StrictMode 安全** — 实例缓存基于引用计数，正确处理双重挂载/卸载

## 为什么选 react-use-echarts？

面向 **React 19 + ECharts 6** 团队的现代化、hook 优先封装。ECharts 仍是唯一事实来源 —— 你直接传 `EChartsOption`，没有需要重新学习的抽象层。

|             | react-use-echarts                           | echarts-for-react      |
| ----------- | ------------------------------------------- | ---------------------- |
| API         | `useEcharts` Hook **和** `<EChart />` 组件  | 仅组件                 |
| 面向        | React 19 —— callback ref、StrictMode 安全   | React 16–18 时代       |
| 自动 resize | `ResizeObserver` + RAF，默认开启            | ✓                      |
| 懒加载      | 内置 `lazyInit`（IntersectionObserver）     | 需手写                 |
| 图表联动    | 内置 `group` prop                           | 手动 `echarts.connect` |
| 错误路由    | `onError` 统一处理图表操作和命令式 API 错误 | 手动 try/catch         |
| 格式与依赖  | ESM-only、可 tree-shake、零运行时依赖       | CJS + ESM，零依赖      |

已在用 `echarts-for-react`？大多数 props 一一对应 —— 见 [从 echarts-for-react 迁移](#从-echarts-for-react-迁移)。

## 环境要求

- React 19.2+（`react` + `react-dom`）—— 内部使用 `useEffectEvent`，该 API 在 19.2 进入 stable
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

## 注册 ECharts 模块

从 v2.1 起 `react-use-echarts` 完全 modular —— 库本身不会自动注册任何图表/组件/渲染器/特性。请在应用入口（首次渲染前）调用以下其中之一：

```ts
// 最简方式 —— 注册 ECharts 内置全套（约 290KB gzip）
import { registerEchartsFull } from "react-use-echarts/preset-full";
registerEchartsFull();
```

或者，为了在生产构建中获得更好的 tree-shake 效果，只显式注册实际用到的模块 —— 参见 [Tree-shaking](#tree-shaking)。

> **原因**：现代打包器（Rolldown/Oxc、Rollup）会把 ECharts 顶层 `use([...])` 副作用调用按纯函数 DCE 掉，因为 ECharts 上游 package.json 的 `sideEffects` 字段不规范。把注册责任放在使用方，可以保证 `react-use-echarts` 在所有现代打包器下都可靠工作 —— 这与 `vue-echarts`、`nuxt-echarts`、`react-chartjs-2` 的做法一致。

## 快速开始

### 1. 注册 ECharts 一次

最快上手方式是在应用入口注册 ECharts 全量能力：

```ts
// main.tsx / index.tsx
import { registerEchartsFull } from "react-use-echarts/preset-full";

registerEchartsFull();
```

生产构建如果只渲染少量图表类型，可以稍后替换为按需 `echarts.use([...])` 注册；图表 API 不变。

### 2. 渲染图表

最简单的组件用法 — 无需手动管理 ref：

```tsx
import { EChart } from "react-use-echarts";

function MyChart() {
  return (
    <EChart
      style={{ width: "100%", height: 400 }}
      option={{
        xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
        yAxis: { type: "value" },
        series: [{ data: [150, 230, 224, 218, 135], type: "line" }],
      }}
    />
  );
}
```

图表容器必须有明确尺寸。上例直接在 `<EChart />` 上设置高度；如果保留默认 `{ width: "100%", height: "100%" }`，则父容器必须有显式高度。

通过 `ref` 可访问命令式 API —— 完整列表见 [返回值](#返回值)（`setOption`、`dispatchAction`、`clear`、`resize`、`appendData`、`getDataURL`、`convertToPixel` 等）。

### 3. 直接使用 Hook

需要完全控制时，直接使用 Hook。它返回一个用于挂载到容器的 callback `ref`、响应式的 `instance` 字段，以及完整的命令式 API：

```tsx
import { useEcharts } from "react-use-echarts";

function MyChart() {
  const { ref, instance, setOption, resize } = useEcharts({
    option: {
      xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
      yAxis: { type: "value" },
      series: [{ data: [150, 230, 224, 218, 135], type: "line" }],
    },
  });
  return <div ref={ref} style={{ width: "100%", height: "400px" }} />;
}
```

`instance` 在初始化前及销毁后为 `undefined`；通过 `useEffect([instance])` 即可订阅实时 ECharts 实例并在其上挂副作用。

图表容器必须有明确尺寸，例如 `style={{ width: "100%", height: "400px" }}`。

## 使用示例

### 主题

内置主题需在应用入口注册一次：

```tsx
import { registerBuiltinThemes } from "react-use-echarts/themes/registry";
registerBuiltinThemes();

// 内置主题
useEcharts({ option, theme: "dark" });

// 任意通过 echarts.registerTheme 注册的主题
useEcharts({ option, theme: "vintage" });

// 自定义主题对象（使用 useMemo 保持引用稳定）
const customTheme = useMemo(() => ({ color: ["#fc8452", "#9a60b4", "#ea7ccc"] }), []);
useEcharts({ option, theme: customTheme });
```

> 注意：直接通过 `echarts.registerTheme()` 注册的主题名（如上面的 `"vintage"`）可以正常使用，但由于本库无法感知这类注册，dev 环境下会触发一次性的警告。推荐改用本库导出的 `registerCustomTheme(name, config)` 按名称注册——注册会被本库跟踪，从而消除该警告。若必须使用 `echarts.registerTheme()`（例如由第三方包代为注册），只要注册发生在图表挂载之前，该警告可以安全忽略；生产构建中不会出现此警告。

### 事件处理

支持简写（函数）和完整配置（带 query/context 的对象）两种写法。已知 echarts 事件的 `params` 类型会从 `EChartsEventPayloadMap` 自动推导，无需手动断言。

```tsx
useEcharts({
  option,
  onEvents: {
    // params 自动推导为 ECElementEvent
    click: (params) => console.log("clicked", params.data),
    mouseover: {
      handler: (params) => console.log("hovered", params.value),
      query: "series",
    },
    // params 自动推导为 SelectChangedPayload
    selectchanged: (params) => console.log("selection changed", params),
  },
});
```

自定义事件名（如通过 `echarts.registerAction()` 注册）会回退到开放索引签名，`params` 类型较宽松。若要为自定义事件获得类型化 payload，可对 `EChartsEventPayloadMap` 做 module augmentation：

```ts
declare module "react-use-echarts" {
  interface EChartsEventPayloadMap {
    "my-custom-action": { foo: number; bar: string };
  }
}
```

### 加载状态

```tsx
const [loading, setLoading] = useState(true);

useEcharts({
  option,
  showLoading: loading,
  loadingOption: { text: "加载中..." },
});
```

### 图表联动

为多个图表指定相同的 `group` ID，tooltip、highlight 等交互将自动同步：

```tsx
useEcharts({ option: option1, group: "dashboard" });
useEcharts({ option: option2, group: "dashboard" });
```

### 懒加载

延迟初始化图表，直到元素滚动进入视口：

```tsx
useEcharts({ option, lazyInit: true });

// 自定义 IntersectionObserver 配置
useEcharts({
  option,
  lazyInit: { rootMargin: "200px", threshold: 0.5 },
});
```

> 注意：懒加载是一次性锁存——「懒」指「首次可见前推迟初始化」，而非持续追踪可见性。一旦元素相交过，图表在该 Hook 的生命周期内保持已初始化：更换容器 DOM 节点或将 `lazyInit` 关闭后再开启都不会重新观察。若需重新进入推迟状态，请重新挂载组件。

### Tree-shaking

库已完全 modular，可按需选择注册粒度：

**第 1 档 —— 全套注册（开发 / 原型）**：一行代码，约 290KB gzip：

```ts
import { registerEchartsFull } from "react-use-echarts/preset-full";
registerEchartsFull();
```

**第 2 档 —— 按需注册（推荐用于生产）**：只注册实际渲染的模块，打包器会 tree-shake 掉其余 ECharts：

```ts
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);
```

可运行示例参见 [`examples/selective-registration/SelectiveRegistrationChart.tsx`](./examples/selective-registration/SelectiveRegistrationChart.tsx)。

**第 3 档 —— 仅 webpack 旧方案**：webpack 对 ECharts 不规范的 `sideEffects` 字段较宽容，所以 `import "echarts";` 在 webpack 应用里仍可工作；但在 Rolldown/Vite/Rollup 下会**静默失败**（图表始终不渲染，控制台抛 zrender 空 painter registry 引起的 `TypeError`）。请改用第 1 或第 2 档。

> ECharts 维护单一全局 registry，`echarts.use([...])` 与 `registerEchartsFull()` 可自由组合，任意顺序，任意位置；但必须在首次 `useEcharts()` 渲染**之前**完成。

### 在 Next.js（App Router）中使用

默认包入口、`preset-full` 与 `themes/registry` 已标注 `"use client"`，因此
即便在 React Server Component 中 import 也不会把 ECharts 打入 server bundle。
把图表封装到自己的客户端组件里，再从任意 Server Component 直接 import：

```tsx
// app/components/MyChart.tsx
"use client";
import { EChart } from "react-use-echarts";
import { registerEchartsFull } from "react-use-echarts/preset-full";

registerEchartsFull();

export function MyChart() {
  return (
    <EChart
      style={{ height: 400 }}
      option={{
        xAxis: { type: "category", data: ["A", "B", "C"] },
        yAxis: { type: "value" },
        series: [{ type: "line", data: [1, 2, 3] }],
      }}
    />
  );
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
- **不要忘记注册 ECharts 模块** — `useEcharts()` 在 ECharts 全局 registry 上初始化实例，所以图表/组件/渲染器/特性必须先注册（通过 `registerEchartsFull()` 或 `echarts.use([...])`）。忘记注册通常表现为 `Renderer 'undefined' is not imported` 报错，或图表静默不渲染；参见 [注册 ECharts 模块](#注册-echarts-模块)。开发模式下若 init 抛出 `… is not a constructor`，库还会打印一次性提示指向此处。
- **`onEvents` 引用应保持稳定** — 每次渲染传入新的 `onEvents` 对象会触发全量重新绑定。使用 `useMemo` 缓存（或提升到模块级）。
- **不要让多个 `useEcharts` 共享同一个 DOM 元素** — 实例缓存会复用同一个 ECharts 实例并在开发模式下打印警告；多个 hook 的更新会互相覆盖。
- **`initOpts` 和自定义 `theme` 对象引用变化会重建实例** — 传递 memoized 对象或模块级常量，除非确实需要重建。
- **StrictMode 安全** — 双挂载/卸载由带引用计数的实例缓存正确处理。

## API 参考

### `<EChart />` Props

封装了 `useEcharts` 的声明式组件。接受所有 Hook 选项作为 props，另外支持：

| Prop        | 类型                  | 默认值                              | 说明                                                                                                              |
| ----------- | --------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `style`     | `React.CSSProperties` | `{ width: '100%', height: '100%' }` | 容器样式（与默认样式合并）                                                                                        |
| `className` | `string`              | —                                   | 容器 CSS 类名                                                                                                     |
| `ref`       | `Ref<EChartHandle>`   | —                                   | 以 `EChartHandle`（`Omit<UseEchartsReturn, 'ref'>` —— 容器 ref 由 `<EChart>` 自管，不再暴露给外部）暴露命令式 API |

### `useEcharts(options)`

#### Options

| 选项            | 类型                                  | 默认值     | 说明                                                                                                |
| --------------- | ------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `option`        | `EChartsOption`                       | （必需）   | ECharts 配置选项                                                                                    |
| `theme`         | `string \| object`                    | —          | 任意已注册主题名或自定义主题对象                                                                    |
| `renderer`      | `'canvas' \| 'svg'`                   | `'canvas'` | 渲染器类型                                                                                          |
| `lazyInit`      | `boolean \| IntersectionObserverInit` | `false`    | 基于 IntersectionObserver 的懒加载                                                                  |
| `group`         | `string`                              | —          | 图表联动组 ID                                                                                       |
| `setOptionOpts` | `SetOptionOpts`                       | —          | `setOption` 的默认选项                                                                              |
| `showLoading`   | `boolean`                             | `false`    | 是否显示加载指示器                                                                                  |
| `loadingOption` | `object`                              | —          | 加载指示器配置                                                                                      |
| `onEvents`      | `EChartsEvents`                       | —          | 事件处理器（`fn` 或 `{ handler, query?, context? }`）                                               |
| `autoResize`    | `boolean`                             | `true`     | 通过 ResizeObserver 自动 resize                                                                     |
| `initOpts`      | `EChartsInitOpts`                     | —          | 传递给 `echarts.init()`（devicePixelRatio、locale 等）                                              |
| `onError`       | `(error: unknown) => void`            | —          | 图表操作和命令式 API 的错误处理回调。未提供时 effect 内失败走 `console.error`，命令式方法则直接抛出 |

#### 返回值

> 优先使用声明式 props（`option`、`theme`、`showLoading` 等），命令式方法仅在 props 未覆盖的场景下使用——例如导出图片、坐标转换、流式追加等。
> 实例未初始化时所有方法均为 no-op 或返回安全默认值。实例抛出错误时：提供 `onError` 时路由错误并返回默认值；未提供 `onError` 时直接重新抛出（读取方法亦同，不会回退到 `console.error`）。

**容器 ref / 实时实例**

| 属性       | 类型                          | 说明                                                                                                                      |
| ---------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ref`      | `RefCallback<HTMLDivElement>` | 挂载到图表容器的 callback ref。需与自有 ref 合并时用 [`mergeRefs`](#其他导出)                                             |
| `instance` | `ECharts \| undefined`        | 响应式 —— 初始化完成后为实例，未初始化与已销毁时为 `undefined`。通过 `useEffect([instance])` 订阅实时实例并在其上挂副作用 |

**生命周期 / 更新**

| 方法             | 类型                                                                                 | 说明                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `setOption`      | `(option: EChartsOption, opts?: SetOptionOpts) => void`                              | 动态更新图表配置                                                                                                     |
| `dispatchAction` | `(payload: Payload, opt?: boolean \| { silent?: boolean; flush?: boolean }) => void` | 派发 ECharts 动作（`highlight`、`downplay`、`showTip` 等）                                                           |
| `clear`          | `() => void`                                                                         | 清空当前图表内容                                                                                                     |
| `resize`         | `(opts?: ResizeOpts) => void`                                                        | 手动触发 resize；`ResizeOpts` 支持 `width`/`height`/`animation`/`silent`                                             |
| `appendData`     | `(params: { seriesIndex: number; data: ArrayLike<unknown> }) => void`                | 向 series 流式追加数据。带漂移感知：会清掉去重缓存，使下次浅相等但新引用的 `option` rerender 重新调用 setOption 同步 |

**读取 / 内省**

| 方法         | 类型                               | 说明                                                |
| ------------ | ---------------------------------- | --------------------------------------------------- |
| `getOption`  | `() => EChartsOption \| undefined` | 获取当前合并后的完整配置                            |
| `getWidth`   | `() => number \| undefined`        | 容器宽度（像素）                                    |
| `getHeight`  | `() => number \| undefined`        | 容器高度（像素）                                    |
| `getDom`     | `() => HTMLElement \| undefined`   | 底层 DOM 容器节点                                   |
| `isDisposed` | `() => boolean`                    | 实例是否已销毁；未初始化时返回 `true`（视作已销毁） |

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
import { useLazyInit } from "react-use-echarts"; // 独立的懒加载 Hook -> { ref, isInView }
import { mergeRefs } from "react-use-echarts"; // 将多个 ref 合并为一个 callback ref
import { isBuiltinTheme, isKnownTheme, registerCustomTheme } from "react-use-echarts"; // 主题工具（不含 JSON）
import { registerBuiltinThemes } from "react-use-echarts/themes/registry"; // 内置主题 JSON（~20KB）
import { registerEchartsFull } from "react-use-echarts/preset-full"; // 一行注册全套（参见「注册 ECharts 模块」）

// 所有导出类型：UseEchartsOptions, UseEchartsReturn, UseLazyInitReturn,
// EChartProps, EChartHandle, EChartsEvents, EChartsEventConfig, EChartsEventHandler,
// EChartsEventPayloadMap, EChartsInitOpts, BuiltinTheme, LoadingOption,
// ChartFinder, ChartScaleValue, Payload。
// EChartsOption、SetOptionOpts、ResizeOpts 现在也从此处转出（源自 "echarts" 包），
// 可与上面的类型一起从 react-use-echarts 统一导入，无需再单独 import "echarts"。
```

`mergeRefs` 返回一个 callback ref，将节点分发到每个传入的 ref —— 支持 `RefObject`、旧式 callback ref、以及带 cleanup 的 React 19 callback ref —— 并对每次调用做 try/catch 隔离，第三方 ref 抛错不会拖垮图表。需要同时拿到 Hook 提供的 ref 和你自己的 ref 时使用：

```tsx
const myRef = useRef<HTMLDivElement>(null);
const { ref } = useEcharts({ option });
return <div ref={mergeRefs(ref, myRef)} style={{ height: 400 }} />;
```

## 从 `echarts-for-react` 迁移

绝大多数 prop 是 1:1 对应，少数被并入现有选项。速查表：

| `echarts-for-react`       | `react-use-echarts`                       | 说明                                                                                                                                               |
| ------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `option`                  | `option`                                  | 一致                                                                                                                                               |
| `theme`                   | `theme`                                   | 一致；内置主题需先调用 `registerBuiltinThemes()`（见[主题](#主题)）                                                                                |
| `notMerge` / `lazyUpdate` | `setOptionOpts: { notMerge, lazyUpdate }` | 合并为单个对象传给 `setOption`                                                                                                                     |
| `showLoading`             | `showLoading`                             | 一致                                                                                                                                               |
| `loadingOption`           | `loadingOption`                           | 一致                                                                                                                                               |
| `onEvents`                | `onEvents`                                | 形态一致；也可写 `{ handler, query?, context? }` 进行 query/context 绑定                                                                           |
| `onChartReady`            | 订阅响应式 `instance`                     | `useEffect(() => { if (instance) onReady(instance); }, [instance])`——返回的 `instance` 初始化前为 `undefined`，init/dispose 完成时会触发 re-render |
| `opts.renderer`           | `renderer: 'canvas' \| 'svg'`             | 提升为顶层字段                                                                                                                                     |
| `opts`（其他字段）        | `initOpts`                                | 形态一致（`devicePixelRatio`、`locale`、`width`、`height`、`useDirtyRect` 等）                                                                     |
| `style`                   | `style`                                   | `<EChart />` 默认 `{ width: '100%', height: '100%' }`，父容器仍需显式高度                                                                          |
| `className`               | `className`                               | 一致                                                                                                                                               |
| `lazyUpdate`（顶层）      | `setOptionOpts: { lazyUpdate: true }`     | 见 `notMerge` 行                                                                                                                                   |
| `shouldSetOption`         | 在父组件中自行控制 `option`               | 顶层键自动经 `shallowEqual` 去重；如需自定义判断（深比较、节流、按应用状态门控），请在父组件中 memoize 或跳过 `option` prop                        |
| `autoResize`（4.x）       | `autoResize`                              | 默认值同为 `true`；底层使用 ResizeObserver + RAF                                                                                                   |
| _无_                      | `lazyInit`                                | 新增：容器进入视口时再初始化                                                                                                                       |
| _无_                      | `group`                                   | 新增：通过组 ID 实现图表联动                                                                                                                       |
| _无_                      | `onError`                                 | 新增：将图表操作错误路由到回调（`init`、`setOption`、事件、loading、resize、group 联动和命令式调用）                                               |

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
// chartRef.current?.instance 替代 onChartReady
```

## 从 v2.x 迁移

v3 移除了旧的 `react-use-echarts/core` 子入口。如果你的代码已经从 `react-use-echarts` 导入，并且已经在首个图表渲染前注册 ECharts 模块，则无需改动。

如果你是从 v2.0 的全量默认入口升级，或应用仍依赖 `import "echarts"` 的副作用注册，请在应用入口**加一次注册调用**：

```ts
// 应用入口（如 main.tsx, index.tsx）
import { registerEchartsFull } from "react-use-echarts/preset-full";
registerEchartsFull();
```

该调用与 v2.0 的自动 ECharts 注册等价，同样的 ~290KB-gzip 全套体验。生产构建若只渲染少数图表类型，请改用 `echarts.use([...])` 按需注册 —— 参见 [Tree-shaking](#tree-shaking)。

请把所有残留的 `from "react-use-echarts/core"` 替换为 `from "react-use-echarts"`。

## 从 v1 迁移

v2.0 翻转了 Hook 形态：返回 callback ref + 响应式 `instance`，对齐 `floating-ui/react`、`react-aria`、`downshift`、`react-hook-form` 等社区现代约定。`<EChart />` 组件对外 props 完全不变，只有直接使用 Hook 的调用方以及 `<EChart ref>` 的类型需要迁移。

| v1                                               | v2                                              | 说明                                                                                                                                 |
| ------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `const ref = useRef(); useEcharts(ref, options)` | `const { ref } = useEcharts(options)`           | Hook 自己持有 callback ref，挂到你的容器即可                                                                                         |
| 返回对象上的 `getInstance()` 方法                | 同一返回对象上的 `instance` 字段                | 响应式 —— init/dispose 完成时触发 re-render，可用 `useEffect([instance])` 订阅                                                       |
| `useLazyInit(ref, options)` 返回 `boolean`       | `useLazyInit(options)` 返回 `{ ref, isInView }` | 同样改为 callback ref 形态                                                                                                           |
| `useRef<UseEchartsReturn>(null)` 配 `<EChart>`   | `useRef<EChartHandle>(null)` 配 `<EChart>`      | `EChartHandle = Omit<UseEchartsReturn, 'ref'>` —— 容器 ref 改由 `<EChart>` 内部自管，不再暴露给外部，杜绝通过 handle 重定向 DOM 节点 |
| 手写合并多个 ref                                 | `mergeRefs(chartRef, myRef)`                    | 新增公开工具（见[其他导出](#其他导出)）                                                                                              |
| `engines.node >=20`                              | `engines.node >=22`                             | 仅影响工具链；发布产物不变                                                                                                           |

并排 Hook 示例：

```tsx
// v1
const chartRef = useRef<HTMLDivElement>(null);
const { setOption, getInstance } = useEcharts(chartRef, { option });
useEffect(() => {
  getInstance()?.on("finished", handler);
}, []);
return <div ref={chartRef} style={{ height: 400 }} />;

// v2
const { ref, instance, setOption } = useEcharts({ option });
useEffect(() => {
  if (!instance) return;
  instance.on("finished", handler);
  return () => instance.off("finished", handler);
}, [instance]);
return <div ref={ref} style={{ height: 400 }} />;
```

## 贡献

我们欢迎所有贡献。请先阅读[贡献指南](CONTRIBUTING.md)。

## 更新日志

每个版本的详细变更请查看[发布说明](https://github.com/chensid/react-use-echarts/releases)。

## 许可证

[MIT](./LICENSE.txt) © [Ethan](https://github.com/chensid)
