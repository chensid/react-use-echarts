# react-use-echarts Agent 开发指南

## 快速概览

`react-use-echarts` 是基于 React 19 与 Apache ECharts 6 的 Hooks 封装，使用 TypeScript 5.9、Vite (Rolldown) 构建，Vitest+Testing Library 做测试。包管理统一使用 `pnpm`，除 `react` 与 `echarts` 外零运行时依赖，输出 `dist/index.es.js`、`dist/index.umd.js` 与 `dist/index.d.ts`。

### 核心特性 (v1.0)

- **ref 由调用方传入** - Hook 不再内部管理 ref，由用户通过 `useRef` 创建并传入
- **TypeScript 支持** - 完整类型定义，类型安全的 API
- **零额外依赖** - 仅依赖 React 和 ECharts
- **主题预设** - 内置 `light`、`dark`、`macarons` 主题，支持自定义主题对象
- **图表联动** - 通过 `group` 字段实现同组图表交互联动（tooltip、highlight 同步）
- **懒加载** - IntersectionObserver 实现视口内初始化，适用于大量图表的页面
- **自动响应尺寸** - ResizeObserver 自动处理容器尺寸变化
- **事件管理** - `onEvents` 支持查询条件与上下文，卸载时自动解绑
- **实例复用** - WeakMap 缓存 + 引用计数，自动释放（支持 StrictMode 多次挂载/卸载）

### v1.0.2 要点

- 主题切换后保持组联动与 loading 状态
- 懒加载完成后自动加入组联动
- `onEvents` 变更时自动重绑，避免旧 handler 残留
- 文档补充实例缓存与组联动工具导出

## 核心 API：useEcharts (v1.0)

```ts
function useEcharts(
  ref: React.RefObject<HTMLDivElement | null>,
  options: UseEchartsOptions
): UseEchartsReturn;
```

### UseEchartsOptions

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `option` | `EChartsOption` | **必填** | ECharts 配置项 |
| `theme` | `'light' \| 'dark' \| 'macarons' \| object \| null` | `null` | 主题名或自定义主题对象 |
| `renderer` | `'canvas' \| 'svg'` | `'canvas'` | 渲染器类型 |
| `lazyInit` | `boolean \| IntersectionObserverInit` | `false` | 懒加载配置 |
| `group` | `string` | - | 图表组 ID，用于联动 |
| `setOptionOpts` | `SetOptionOpts` | - | setOption 默认选项 |
| `showLoading` | `boolean` | `false` | 是否显示加载状态 |
| `loadingOption` | `object` | - | 加载配置项 |
| `onEvents` | `EChartsEvents` | - | 事件配置 |

### UseEchartsReturn

| 方法 | 类型 | 说明 |
|------|------|------|
| `setOption` | `(option: EChartsOption, opts?: SetOptionOpts) => void` | 动态更新配置 |
| `getInstance` | `() => ECharts \| undefined` | 获取 ECharts 实例（初始化前返回 `undefined`） |
| `resize` | `() => void` | 手动触发 resize |

### EChartsEvents

```ts
interface EChartsEvents {
  [eventName: string]: {
    handler: (params: unknown) => void;  // 事件处理函数
    query?: string | object;              // 查询条件（可选）
    context?: object;                     // 处理函数上下文（可选）
  };
}
```

### 基本用法

```tsx
import { useRef } from 'react';
import { useEcharts } from 'react-use-echarts';

function LineChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  const { setOption } = useEcharts(chartRef, {
    option: {
      xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed'] },
      yAxis: { type: 'value' },
      series: [{ type: 'line', data: [120, 200, 150] }],
    },
    theme: 'dark',
    lazyInit: true,
  });

  return <div ref={chartRef} style={{ width: '100%', height: 400 }} />;
}
```

## 辅助 API

### useLazyInit

IntersectionObserver 封装，用于懒加载场景。

```ts
function useLazyInit(
  ref: React.RefObject<HTMLElement | null>,
  options?: boolean | IntersectionObserverInit
): boolean;  // 返回元素是否已进入视口
```

默认配置：`rootMargin: '50px'`，`threshold: 0.1`。

### 主题工具函数

```ts
// 获取所有可用的内置主题名称
getAvailableThemes(): BuiltinTheme[]  // ['light', 'dark', 'macarons']

// 检查是否为内置主题
isBuiltinTheme(themeName: string): boolean

// 获取内置主题配置对象
getBuiltinTheme(themeName: BuiltinTheme): object | null

// 注册自定义主题（全局）
registerCustomTheme(themeName: string, themeConfig: object): void

// 注册内置主题到 ECharts（模块加载时自动调用，一般无需手动调用）
registerBuiltinThemes(): void
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
pnpm build       # tsc + vite build
npm version <type> && npm publish
```

构建产物默认写入 `dist/`，并由 `files` 字段自动打包。

## 测试与质量

- Vitest + jsdom 驱动 hooks 测试，ECharts API 通过全面 mock 保障行为一致。
- 重点校验初始化、`setOption`、主题切换、事件绑定、loading 状态与清理逻辑。
- 覆盖率报告位于 `coverage/`，必要时查阅 HTML 报告定位薄弱区域。

## 目录速览

```text
src/
├── hooks/
│   ├── use-echarts.ts       # 主 Hook
│   └── use-lazy-init.ts     # IntersectionObserver 封装
├── themes/
│   ├── index.ts             # 主题注册与导出
│   └── presets/             # 内置主题 JSON (light/dark/macarons)
├── utils/
│   ├── index.ts             # 工具函数导出
│   ├── instance-cache.ts    # WeakMap 实例缓存 + 引用计数
│   └── connect.ts           # 图表联动逻辑
├── types/
│   └── index.ts             # 类型定义与导出
├── __tests__/               # Vitest 测试用例
│   ├── hooks/
│   ├── themes/
│   └── utils/
└── index.ts                 # 包入口
examples/                    # React 示例应用
dist/                        # 构建输出 (es/umd/d.ts)
```

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

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 图表空白 | `chartRef` 未挂载或容器无尺寸 | 确认 ref 已绑定，容器有 width/height |
| 事件无效 | `query` 不匹配或已被解绑 | 检查 `onEvents.query` 配置，确认事件名正确 |
| 内存上涨 | 重复 `init` 或未 `dispose` | 使用 `getInstance()` 检查实例状态 |
| Resize 报错 | 测试/旧浏览器缺少 ResizeObserver | 忽略警告或手动 polyfill |
| 主题不生效 | 主题名拼写错误或类型错误 | 内置主题用字符串，自定义主题用对象 |
| 自定义主题重复创建 | 每次渲染传入新对象 | 使用 `useMemo` 缓存主题对象 |

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
