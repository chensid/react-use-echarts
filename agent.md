# react-use-echarts Agent 开发指南

## 快速概览

`react-use-echarts` 是基于 React 19 与 Apache ECharts 6 的 Hooks 封装，使用 TypeScript 5.9、Vite+Rollup 构建，Vitest+Testing Library 做测试。包管理统一使用 `pnpm`，除 `react` 与 `echarts` 外零运行时依赖，输出 `dist/index.es.js`、`dist/index.umd.js` 与 `dist/index.d.ts`。

### 核心特性 (v1.0)

- **ref 由调用方传入** - Hook 不再内部管理 ref
- **主题预设** - 内置 `light`、`dark`、`macarons` 主题
- **图表联动** - 通过 `group` 字段实现同组图表交互联动
- **自动释放与实例复用** - WeakMap 缓存 + 引用计数
- **懒加载** - IntersectionObserver 实现视口内初始化
- **自动响应容器尺寸变化** - ResizeObserver
- **事件管理** - `onEvents` 支持查询条件与上下文，卸载时自动解绑

## 核心 API：useEcharts (v1.0)

```ts
function useEcharts(
  ref: React.RefObject<HTMLDivElement | null>,
  options: UseEchartsOptions
): UseEchartsReturn;

interface UseEchartsOptions {
  /** 图表配置 */
  option: EChartsOption;
  /** 主题：内置预设名 | 自定义对象 | null */
  theme?: BuiltinTheme | object | null;
  /** 渲染器，默认 'canvas' */
  renderer?: 'canvas' | 'svg';
  /** 懒加载：仅当容器进入视口时初始化 */
  lazyInit?: boolean | IntersectionObserverInit;
  /** 图表组 ID，用于联动 */
  group?: string;
  /** setOption 默认选项 */
  setOptionOpts?: SetOptionOpts;
  /** loading 状态 */
  showLoading?: boolean;
  loadingOption?: object;
  /** 事件配置 */
  onEvents?: EChartsEvents;
}

interface UseEchartsReturn {
  /** 动态更新配置 */
  setOption: (option: EChartsOption, opts?: SetOptionOpts) => void;
  /** 获取实例 */
  getInstance: () => ECharts | undefined;
  /** 手动触发 resize */
  resize: () => void;
}
```

### 使用示例

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
  hooks/
    use-echarts.ts       # 主 Hook
    use-lazy-init.ts     # IntersectionObserver 封装
  themes/
    index.ts             # 主题注册与导出
    presets/             # 内置主题 JSON
  utils/
    instance-cache.ts    # WeakMap 实例缓存
    connect.ts           # 联动逻辑
  types/index.ts         # 类型导出
  __tests__/hooks/...    # Vitest 用例
  index.ts               # 包入口
examples/                # React 示例
dist/                    # 构建输出
```

## 开发约定

- **API 设计**：沿用 React Hooks 语义，参数保持可组合，避免新增布尔开关堆叠，优先通过数据结构抽象减少分支。
- **类型安全**：任何新能力先补 `src/types/index.ts`，必要时补充 JSDoc，保证导出的类型对外稳定。
- **性能/内存**：使用 `useRef`/`useCallback` 控制重渲染；新增副作用必须实现成对清理，禁止遗留监听或定时器。
- **变更步骤**：实现 → 更新类型/导出 → 补测试 → 更新 README/示例 → 自测 lint+test → 提交。

## 排障备忘

1. 图表空白：确认 `chartRef` 已挂载且容器有尺寸。
2. 事件无效：检查 `onEvents` 的 `query` 是否匹配元素，或在卸载前是否被解绑。
3. 内存上涨：确认未重复 `init`，以及卸载时确实触发 `dispose`。
4. Resize 报错：多为测试或旧浏览器缺乏 `ResizeObserver`，可忽略警告或手动 polyfill。
5. 主题不生效：检查主题名是否正确，自定义主题需传对象而非字符串。

## 贡献流程

- 所有改动使用 TypeScript，遵循现有 eslint 规则，提交前执行 `pnpm lint && pnpm test`.
- Commit 信息采用 `feat|fix|docs|test|refactor: <subject>`。
- PR 需附：变更说明、必要示例或截图、测试结果摘要；避免破坏向后兼容接口，若有 Breaking Change 必须在 README 与 release note 明示。
