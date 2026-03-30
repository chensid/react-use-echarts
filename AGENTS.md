# react-use-echarts Agent 开发指南

> 项目概述、目录结构、命令、Effect 结构、测试配置和基本约定见 `CLAUDE.md`，此处不再重复。

## 核心特性

- `useEcharts` Hook + `EChart` 声明式组件，双模式按需选用
- ref 由调用方传入，Hook 不内部管理 ref
- WeakMap 实例缓存 + 引用计数，支持 StrictMode
- initOpts 序列化稳定化，避免内联对象导致实例重建
- 两级主题缓存：内置 `light`/`dark`/`macarons` + 自定义主题对象自动去重
- `group` 字段实现图表联动（tooltip、highlight 同步）
- IntersectionObserver 懒加载 + ResizeObserver 自动响应尺寸
- `onEvents` 支持简写函数与完整配置对象，变更时自动重绑
- `onError` 统一捕获 init/setOption 异常
- React Compiler 已启用

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

1. 先在 `src/types/index.ts` 补充类型定义
2. 实现功能，确保副作用有成对清理
3. 补充测试用例
4. 更新 README / 示例
5. `vp check && vp test run`
6. 提交：`feat|fix|docs|test|refactor|chore: <subject>`

## 排障备忘

| 问题               | 原因                   | 解决                                  |
| ------------------ | ---------------------- | ------------------------------------- |
| 图表空白           | ref 未挂载或容器无尺寸 | 确认 ref 已绑定，容器有 width/height  |
| 事件无效           | query 不匹配或已解绑   | 检查 `onEvents.query`，确认事件名     |
| 内存上涨           | 重复 init 或未 dispose | 用 `getInstance()` 检查实例状态       |
| 主题不生效         | 主题名拼写/类型错误    | 内置用字符串，自定义用对象            |
| 自定义主题重复创建 | 每次渲染传新对象       | `useMemo` 缓存（Hook 有两级缓存兜底） |
