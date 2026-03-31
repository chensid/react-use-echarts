# react-use-echarts Agent 开发指南

> 项目概述、目录结构、命令、Effect 结构、测试配置和基本约定见 `CLAUDE.md`，此处不再重复。

## Vite+ 工具链

本项目使用 **Vite+**（统一 Web 工具链），通过全局 CLI `vp` 管理完整开发生命周期。Vite+ 将 Vite 8、Rolldown、Vitest、tsdown、Oxlint、Oxfmt 封装为单一工具链。完整命令列表见 `CLAUDE.md` 或运行 `vp help`。

### 关键规则

- **始终使用 `vp` 命令**，不要直接使用 pnpm/npm/yarn
- **不要运行 `vp vitest` 或 `vp oxlint`**，正确写法是 `vp test` 和 `vp lint`
- **从 `vite-plus` 导入模块**，而非 `vite` 或 `vitest`：
  ```ts
  import { defineConfig } from "vite-plus";
  import { expect, test, vi } from "vite-plus/test";
  ```
- **不要单独安装** Vitest、Oxlint、Oxfmt 或 tsdown —— 它们已内置于 vite-plus
- **使用 `vp dlx`** 代替 `npx`/`pnpm dlx`
- **内置命令优先**：`vp dev`/`vp build`/`vp test` 始终执行内置工具，而非 `package.json` 同名 script。若需运行自定义 script，用 `vp run <script>`
- **Type-aware linting** 开箱即用：`vp lint --type-aware`，无需额外安装 `oxlint-tsgolint`

### 配置方式

所有工具配置统一在 `vite.config.ts` 中通过扩展块管理：

| 配置块   | 用途           | 替代文件                         |
| -------- | -------------- | -------------------------------- |
| `test`   | Vitest 配置    | `vitest.config.ts`               |
| `lint`   | Oxlint 规则    | `.eslintrc` / `eslint.config.js` |
| `fmt`    | Oxfmt 格式化   | `.prettierrc`                    |
| `pack`   | tsdown 库构建  | `tsdown.config.ts`               |
| `staged` | 暂存文件检查   | `lint-staged` 配置               |
| `run`    | 任务编排与缓存 | -                                |

### CI 集成

使用 [`voidzero-dev/setup-vp@v1`](https://github.com/voidzero-dev/setup-vp) GitHub Action，替代单独的 setup-node、包管理器和缓存步骤。

> 完整的 Vite+ Agent 指南见 `node_modules/vite-plus/AGENTS.md`。

## 补充特性说明

> 核心设计模式（ref 传入、WeakMap 缓存、initOpts 稳定化、两级主题缓存、React Compiler）见 `CLAUDE.md`。

- `group` 字段实现图表联动（tooltip、highlight 同步）
- IntersectionObserver 懒加载 + ResizeObserver 自动响应尺寸
- `onEvents` 支持简写函数与完整配置对象，变更时自动重绑
- `onError` 统一捕获 init/setOption 异常

## API 参考

### useEcharts

```ts
function useEcharts(
  ref: React.RefObject<HTMLDivElement | null>,
  options: UseEchartsOptions,
): UseEchartsReturn;
```

**UseEchartsOptions**

| 属性            | 类型                                  | 默认值     | 说明                   |
| --------------- | ------------------------------------- | ---------- | ---------------------- |
| `option`        | `EChartsOption`                       | **必填**   | ECharts 配置项         |
| `theme`         | `BuiltinTheme \| object \| null`      | `null`     | 主题名或自定义主题对象 |
| `renderer`      | `'canvas' \| 'svg'`                   | `'canvas'` | 渲染器                 |
| `lazyInit`      | `boolean \| IntersectionObserverInit` | `false`    | 懒加载                 |
| `group`         | `string`                              | -          | 联动组 ID              |
| `setOptionOpts` | `SetOptionOpts`                       | -          | setOption 选项         |
| `showLoading`   | `boolean`                             | `false`    | 加载状态               |
| `loadingOption` | `object`                              | -          | 加载配置               |
| `onEvents`      | `EChartsEvents`                       | -          | 事件配置               |
| `autoResize`    | `boolean`                             | `true`     | 自动 resize            |
| `initOpts`      | `EChartsInitOpts`                     | -          | `echarts.init()` 选项  |
| `onError`       | `(error: unknown) => void`            | -          | 错误处理               |

**UseEchartsReturn** — `setOption(option, opts?)` / `getInstance()` / `resize()`

### EChart 组件

`useEcharts` 的封装，继承全部 `UseEchartsOptions`，额外支持 `style`（默认 `{ width: '100%', height: '400px' }`）和 `className`。通过 `forwardRef` 暴露 `UseEchartsReturn`。

### 事件配置

```ts
type EChartsEventConfig =
  | ((params: unknown) => void) // 简写
  | { handler: (params: unknown) => void; query?: string | object; context?: object }; // 完整

interface EChartsEvents {
  [eventName: string]: EChartsEventConfig;
}
```

### useLazyInit

```ts
function useLazyInit(
  ref: React.RefObject<Element | null>,
  options?: boolean | IntersectionObserverInit,
): boolean;
```

默认 `rootMargin: '50px'`，`threshold: 0.1`，返回元素是否已进入视口。

## 变更流程

见 `CLAUDE.md` 的 Conventions 部分。

## 排障备忘

| 问题               | 原因                   | 解决                                  |
| ------------------ | ---------------------- | ------------------------------------- |
| 图表空白           | ref 未挂载或容器无尺寸 | 确认 ref 已绑定，容器有 width/height  |
| 事件无效           | query 不匹配或已解绑   | 检查 `onEvents.query`，确认事件名     |
| 内存上涨           | 重复 init 或未 dispose | 用 `getInstance()` 检查实例状态       |
| 主题不生效         | 主题名拼写/类型错误    | 内置用字符串，自定义用对象            |
| 自定义主题重复创建 | 每次渲染传新对象       | `useMemo` 缓存（Hook 有两级缓存兜底） |
