# react-use-echarts Agent 开发指南

## 快速概览

`react-use-echarts` 是基于 React 19 与 Apache ECharts 6 的 Hooks 封装，使用 TypeScript 5.9、Vite (Rolldown) 构建，Vitest+Testing Library 做测试。包管理统一使用 `pnpm`，除 `react` 与 `echarts` 外零运行时依赖，输出 `dist/index.es.js`、`dist/index.umd.js` 与 `dist/index.d.ts`。

### 核心特性

- **双模式** - `useEcharts` Hook + `EChart` 声明式组件，按需选用
- **ref 由调用方传入** - Hook 不内部管理 ref，由用户通过 `useRef` 创建并传入
- **TypeScript 支持** - 完整类型定义，类型安全的 API
- **零额外依赖** - 仅依赖 React 和 ECharts
- **主题预设** - 内置 `light`、`dark`、`macarons` 主题，支持自定义主题对象（两级缓存自动去重）
- **图表联动** - 通过 `group` 字段实现同组图表交互联动（tooltip、highlight 同步）
- **懒加载** - IntersectionObserver 实现视口内初始化，适用于大量图表的页面
- **自动响应尺寸** - ResizeObserver 自动处理容器尺寸变化，可通过 `autoResize` 关闭
- **事件管理** - `onEvents` 支持简写函数与完整配置对象，变更时自动重绑，卸载时自动解绑
- **实例复用** - WeakMap 缓存 + 引用计数，自动释放（支持 StrictMode 多次挂载/卸载）
- **initOpts 稳定化** - 内部序列化为稳定 key，避免内联对象导致实例反复重建
- **错误处理** - `onError` 回调统一捕获 init / setOption 等操作异常

## 核心 API：useEcharts

```ts
function useEcharts(
  ref: React.RefObject<HTMLDivElement | null>,
  options: UseEchartsOptions,
): UseEchartsReturn;
```

### UseEchartsOptions

| 属性            | 类型                                  | 默认值     | 说明                                                          |
| --------------- | ------------------------------------- | ---------- | ------------------------------------------------------------- |
| `option`        | `EChartsOption`                       | **必填**   | ECharts 配置项                                                |
| `theme`         | `BuiltinTheme \| object \| null`      | `null`     | 主题名（`'light'` / `'dark'` / `'macarons'`）或自定义主题对象 |
| `renderer`      | `'canvas' \| 'svg'`                   | `'canvas'` | 渲染器类型                                                    |
| `lazyInit`      | `boolean \| IntersectionObserverInit` | `false`    | 懒加载配置                                                    |
| `group`         | `string`                              | -          | 图表组 ID，用于联动                                           |
| `setOptionOpts` | `SetOptionOpts`                       | -          | setOption 默认选项                                            |
| `showLoading`   | `boolean`                             | `false`    | 是否显示加载状态                                              |
| `loadingOption` | `object`                              | -          | 加载配置项                                                    |
| `onEvents`      | `EChartsEvents`                       | -          | 事件配置（支持简写与完整写法）                                |
| `autoResize`    | `boolean`                             | `true`     | 容器尺寸变化时是否自动 resize（ResizeObserver）               |
| `initOpts`      | `EChartsInitOpts`                     | -          | 传递给 `echarts.init()` 的选项                                |
| `onError`       | `(error: unknown) => void`            | -          | 图表操作的错误处理回调                                        |

### UseEchartsReturn

| 方法          | 类型                                                    | 说明                                          |
| ------------- | ------------------------------------------------------- | --------------------------------------------- |
| `setOption`   | `(option: EChartsOption, opts?: SetOptionOpts) => void` | 动态更新配置                                  |
| `getInstance` | `() => ECharts \| undefined`                            | 获取 ECharts 实例（初始化前返回 `undefined`） |
| `resize`      | `() => void`                                            | 手动触发 resize                               |

### 基本用法

```tsx
import { useRef } from "react";
import { useEcharts } from "react-use-echarts";

function LineChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  const { setOption } = useEcharts(chartRef, {
    option: {
      xAxis: { type: "category", data: ["Mon", "Tue", "Wed"] },
      yAxis: { type: "value" },
      series: [{ type: "line", data: [120, 200, 150] }],
    },
    theme: "dark",
    lazyInit: true,
  });

  return <div ref={chartRef} style={{ width: "100%", height: 400 }} />;
}
```

## 声明式组件：EChart

`useEcharts` 的薄封装，适用于不需要手动管理 ref 的场景。

```tsx
import { EChart } from "react-use-echarts";

function SimpleChart() {
  return (
    <EChart
      option={{
        xAxis: { type: "category", data: ["Mon", "Tue", "Wed"] },
        yAxis: { type: "value" },
        series: [{ type: "line", data: [120, 200, 150] }],
      }}
      theme="dark"
      style={{ height: 300 }}
    />
  );
}
```

### EChartProps

继承 `UseEchartsOptions` 全部属性，额外增加：

| 属性        | 类型                  | 默认值                               | 说明                         |
| ----------- | --------------------- | ------------------------------------ | ---------------------------- |
| `style`     | `React.CSSProperties` | `{ width: '100%', height: '400px' }` | 容器内联样式（与默认值合并） |
| `className` | `string`              | -                                    | 容器 div 的 CSS 类名         |

### ref 暴露

组件通过 `forwardRef` 暴露 `UseEchartsReturn`（`setOption`、`getInstance`、`resize`）：

```tsx
const chartRef = useRef<UseEchartsReturn>(null);
<EChart ref={chartRef} option={...} />
// chartRef.current?.getInstance()
```

## 类型定义

### EChartsEventConfig

事件配置支持两种写法：

```ts
type EChartsEventConfig =
  | ((params: unknown) => void) // 简写：直接传函数
  | {
      handler: (params: unknown) => void; // 完整写法
      query?: string | object;
      context?: object;
    };
```

### EChartsEvents

```ts
interface EChartsEvents {
  [eventName: string]: EChartsEventConfig;
}
```

示例：

```ts
onEvents={{
  click: (params) => console.log(params),          // 简写
  mouseover: { handler: fn, query: 'series' },     // 完整写法
}}
```

### EChartsInitOpts

类型从 ECharts 官方派生（`Omit<RawEChartsInitOpts, 'renderer' | 'ssr'>`），主要字段：

| 字段               | 类型               | 说明                    |
| ------------------ | ------------------ | ----------------------- |
| `devicePixelRatio` | `number`           | 设备像素比              |
| `locale`           | `string`           | 语言区域                |
| `width`            | `number \| string` | 画布宽度                |
| `height`           | `number \| string` | 画布高度                |
| `useDirtyRect`     | `boolean`          | Canvas 脏矩形渲染优化   |
| `useCoarsePointer` | `boolean`          | 移动端智能指针捕获      |
| `pointerSize`      | `number`           | 指针捕获半径，默认 44px |

注：`renderer` 作为 Hook 独立参数，`ssr` 在 Hook 场景不适用，均已剔除。

## 辅助 API

### useLazyInit

IntersectionObserver 封装，用于懒加载场景。

```ts
function useLazyInit(
  elementRef: React.RefObject<Element | null>,
  options?: boolean | IntersectionObserverInit,
): boolean; // 返回元素是否已进入视口
```

默认配置：`rootMargin: '50px'`，`threshold: 0.1`。

### 主题工具函数

```ts
getAvailableThemes(): BuiltinTheme[]                       // ['light', 'dark', 'macarons']
isBuiltinTheme(themeName: string): themeName is BuiltinTheme
getBuiltinTheme(themeName: BuiltinTheme): object | null
registerCustomTheme(themeName: string, themeConfig: object): void
registerBuiltinThemes(): void                               // 一般无需手动调用
ensureBuiltinThemesRegistered(): void                       // 幂等，Hook 内部自动调用
```

### 实例缓存与组联动工具（高级）

```ts
// 实例缓存
getCachedInstance(element: HTMLElement): ECharts | undefined
setCachedInstance(element: HTMLElement, instance: ECharts): ECharts
replaceCachedInstance(element: HTMLElement, instance: ECharts): ECharts
releaseCachedInstance(element: HTMLElement): void
getReferenceCount(element: HTMLElement): number
clearInstanceCache(): void

// 组联动
addToGroup(instance: ECharts, groupId: string): void
removeFromGroup(instance: ECharts, groupId: string): void
updateGroup(instance: ECharts, oldGroupId?: string, newGroupId?: string): void
getGroupInstances(groupId: string): ECharts[]
getInstanceGroup(instance: ECharts): string | undefined
isInGroup(instance: ECharts): boolean
clearGroups(): void
```

## 包导出一览

```ts
// Hook
export { useEcharts } from "./hooks/use-echarts";
export { useLazyInit } from "./hooks/use-lazy-init";

// 组件
export { EChart } from "./components/EChart";

// 类型
export type {
  UseEchartsOptions,
  UseEchartsReturn,
  EChartsEvents,
  EChartsEventConfig,
  EChartsInitOpts,
  EChartProps,
  BuiltinTheme,
};

// 主题工具
export {
  registerBuiltinThemes,
  ensureBuiltinThemesRegistered,
  getBuiltinTheme,
  isBuiltinTheme,
  registerCustomTheme,
  getAvailableThemes,
};

// 实例缓存
export {
  getCachedInstance,
  setCachedInstance,
  replaceCachedInstance,
  releaseCachedInstance,
  getReferenceCount,
  clearInstanceCache,
};

// 组联动
export {
  addToGroup,
  removeFromGroup,
  updateGroup,
  getGroupInstances,
  getInstanceGroup,
  isInGroup,
  clearGroups,
};
```

## Hook 内部 Effect 结构

`useEcharts` 内部按职责拆分为 6 个 Effect，便于理解依赖关系和调试：

| Effect                | 调度              | 依赖                                               | 职责                                                         |
| --------------------- | ----------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| 1. Instance Lifecycle | `useLayoutEffect` | `shouldInit, ref, themeKey, renderer, initOptsKey` | 复用缓存或创建实例，首次 setOption、事件绑定、loading、group |
| 2. Option Updates     | `useEffect`       | `getInstance, option, setOptionOpts`               | option 变更后调用 `setOption`（跳过 init 已应用的相同值）    |
| 3. Loading State      | `useEffect`       | `getInstance, showLoading, loadingOption`          | 切换 loading 状态                                            |
| 4. Event Rebinding    | `useEffect`       | `getInstance, onEvents`                            | `onEvents` 引用变更时解绑旧、绑定新                          |
| 5. Group Changes      | `useEffect`       | `getInstance, group`                               | 动态切换图表组                                               |
| 6. Resize Observer    | `useEffect`       | `ref, autoResize`                                  | 创建/销毁 ResizeObserver                                     |

## 目录速览

```text
src/
├── components/
│   └── EChart.tsx           # 声明式 EChart 组件
├── hooks/
│   ├── use-echarts.ts       # 主 Hook
│   └── use-lazy-init.ts     # IntersectionObserver 封装
├── themes/
│   ├── index.ts             # 主题注册与导出
│   └── presets/             # 内置主题 JSON (light/dark/macarons)
├── utils/
│   ├── instance-cache.ts    # WeakMap 实例缓存 + 引用计数
│   └── connect.ts           # 图表联动逻辑
├── types/
│   └── index.ts             # 类型定义与导出
├── __tests__/               # Vitest 测试用例
│   ├── components/          # EChart 组件测试
│   ├── hooks/               # use-echarts / use-lazy-init / theme-change
│   ├── themes/
│   └── utils/
└── index.ts                 # 包入口
examples/                    # React 示例应用
dist/                        # 构建输出 (es/umd/d.ts)
```

## 开发流程

### 安装与启动

```bash
pnpm install
pnpm dev
```

### 常用命令

```bash
pnpm test        # vitest
pnpm coverage    # 覆盖率报告
pnpm lint        # eslint
pnpm typecheck   # tsc -b
pnpm build       # vite build
npm version <type> && npm publish
```

构建产物默认写入 `dist/`，并由 `files` 字段自动打包。

## 测试与质量

- Vitest + jsdom 驱动 hooks 测试，ECharts API 通过全面 mock 保障行为一致。
- 重点校验初始化、`setOption`、主题切换、事件绑定、loading 状态与清理逻辑。
- 覆盖率报告位于 `coverage/`，必要时查阅 HTML 报告定位薄弱区域。

## 开发约定

### API 设计

- 沿用 React Hooks 语义，参数保持可组合
- 避免新增布尔开关堆叠，优先通过数据结构抽象减少分支
- 向后兼容：不破坏现有接口和使用方式

### 类型安全

- 新能力先在 `src/types/index.ts` 补充类型定义
- 必要时补充 JSDoc，保证导出的类型对外稳定
- 使用 `BuiltinTheme` 等类型别名提高可读性

### 性能/内存

- 使用 `useRef`/`useCallback` 控制重渲染
- 新增副作用必须实现成对清理（cleanup function）
- 禁止遗留监听器或定时器

### 变更步骤

1. 实现功能
2. 更新类型定义和导出
3. 补充测试用例
4. 更新 README/示例
5. 自测 `pnpm lint && pnpm test`
6. 提交（commit message 格式：`feat|fix|docs|test|refactor: <subject>`）

## 排障备忘

| 问题               | 原因                             | 解决方案                                               |
| ------------------ | -------------------------------- | ------------------------------------------------------ |
| 图表空白           | `chartRef` 未挂载或容器无尺寸    | 确认 ref 已绑定，容器有 width/height                   |
| 事件无效           | `query` 不匹配或已被解绑         | 检查 `onEvents.query` 配置，确认事件名正确             |
| 内存上涨           | 重复 `init` 或未 `dispose`       | 使用 `getInstance()` 检查实例状态                      |
| Resize 报错        | 测试/旧浏览器缺少 ResizeObserver | 忽略警告或手动 polyfill                                |
| 主题不生效         | 主题名拼写错误或类型错误         | 内置主题用字符串，自定义主题用对象                     |
| 自定义主题重复创建 | 每次渲染传入新对象               | 使用 `useMemo` 缓存主题对象（Hook 内部有两级缓存兜底） |

## 贡献流程

### 提交前检查

```bash
pnpm lint && pnpm test
```

### Commit 规范

```text
feat|fix|docs|test|refactor|chore: <subject>
```

### PR 要求

- 变更说明清晰
- 附测试结果摘要
- Breaking Change 需在 README 和 release note 中明示
- 必要时附示例或截图
