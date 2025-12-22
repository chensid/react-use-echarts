# react-use-echarts

[![NPM version](https://img.shields.io/npm/v/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![NPM downloads](https://img.shields.io/npm/dm/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/chensid/react-use-echarts/npm-publish.yml)](https://github.com/chensid/react-use-echarts/actions/workflows/npm-publish.yml)
[![GitHub issues](https://img.shields.io/github/issues/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/pulls)
[![GitHub license](https://img.shields.io/github/license/chensid/react-use-echarts.svg)](https://github.com/chensid/react-use-echarts/blob/main/LICENSE.txt)

A React hooks library for Apache ECharts with full TypeScript support. Simple, lightweight, and gets out of your way.

## ✨ Features

- 🎨 **Easy to use** - Simple and intuitive API with React Hooks
- 🚀 **TypeScript support** - Written in TypeScript with complete type definitions
- 📦 **Lightweight** - Zero dependencies except for React and ECharts
- 🛠 **Flexible** - Full access to ECharts instance and options
- ⚡ **Auto-updating** - Automatically updates chart when data or options change
- 📱 **Responsive** - Handles container resizing automatically with ResizeObserver
- 🎯 **Event handling** - Easy to use event system with flexible configuration
- 🎭 **Built-in themes** - Includes light, dark, and macarons themes out of the box
- 🔗 **Chart linkage** - Connect multiple charts for synchronized interactions
- 🦥 **Lazy initialization** - Only initialize charts when they enter the viewport

## 📋 Requirements

- React 19.x
- ECharts 6.x

> **Note**: This library is designed for client-side rendering (CSR) only. Server-side rendering (SSR) is not supported as ECharts requires DOM access.

## 📦 Installation

```bash
# Using npm
npm install react-use-echarts echarts

# Using yarn
yarn add react-use-echarts echarts

# Using pnpm
pnpm add react-use-echarts echarts
```

## 🔨 Usage

```tsx
import { useRef } from 'react';
import { useEcharts } from 'react-use-echarts';
import type { EChartsOption } from 'echarts';

function MyChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEcharts(chartRef, {
    option: {
      xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      yAxis: { type: 'value' },
      series: [{ data: [820, 932, 901, 934, 1290, 1330, 1320], type: 'line' }]
    }
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
```

## 🚀 Advanced Usage

### Event Handling

```tsx
import { useRef } from 'react';
import { useEcharts } from 'react-use-echarts';
import type { EChartsOption } from 'echarts';

function InteractiveChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  const options: EChartsOption = {
    xAxis: { type: 'category', data: ['A', 'B', 'C'] },
    yAxis: { type: 'value' },
    series: [{ data: [120, 200, 150], type: 'bar' }]
  };

  useEcharts(chartRef, {
    option: options,
    onEvents: {
      click: {
        handler: (params) => {
          console.log('Clicked:', params);
        }
      },
      mouseover: {
        handler: (params) => {
          console.log('Hover:', params);
        },
        query: 'series' // Only trigger on series elements
      }
    }
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
```

### Loading State

```tsx
import { useState, useEffect, useRef } from 'react';
import { useEcharts } from 'react-use-echarts';

function ChartWithLoading() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<number[]>([]);

  // Simulate data fetching
  useEffect(() => {
    setTimeout(() => {
      setData([820, 932, 901, 934, 1290, 1330, 1320]);
      setLoading(false);
    }, 2000);
  }, []);

  useEcharts(chartRef, {
    option: {
      xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
      yAxis: { type: 'value' },
      series: [{ data, type: 'line' }]
    },
    showLoading: loading
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
```

### Dynamic Updates

```tsx
import { useState, useRef } from 'react';
import { useEcharts } from 'react-use-echarts';

function DynamicChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState([120, 200, 150, 80, 70, 110, 130]);

  const { setOption } = useEcharts(chartRef, {
    option: {
      xAxis: { type: 'category', data: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
      yAxis: { type: 'value' },
      series: [{ data, type: 'bar' }]
    }
  });

  const updateData = () => {
    const newData = data.map(() => Math.floor(Math.random() * 200));
    setData(newData);
    setOption({
      series: [{ data: newData }]
    });
  };

  return (
    <div>
      <button onClick={updateData}>Update Data</button>
      <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
    </div>
  );
}
```

### Themes

内置主题：`light`、`dark`、`macarons`，或传入自定义主题对象。

```tsx
import { useRef, useMemo } from 'react';
import { useEcharts } from 'react-use-echarts';

// 使用内置主题
function BuiltinThemeChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEcharts(chartRef, {
    option: {
      xAxis: { type: 'category', data: ['A', 'B', 'C'] },
      yAxis: { type: 'value' },
      series: [{ data: [120, 200, 150], type: 'bar' }]
    },
    theme: 'dark' // 'light' | 'dark' | 'macarons'
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}

// 使用自定义主题（建议使用 useMemo 避免不必要的重渲染）
function CustomThemeChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const customTheme = useMemo(() => ({
    color: ['#fc8452', '#9a60b4', '#ea7ccc'],
    backgroundColor: '#1e1e1e'
  }), []);

  useEcharts(chartRef, {
    option: {
      xAxis: { type: 'category', data: ['A', 'B', 'C'] },
      yAxis: { type: 'value' },
      series: [{ data: [120, 200, 150], type: 'bar' }]
    },
    theme: customTheme
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
```

### Chart Linkage

通过 `group` 选项连接多个图表，实现同步交互（如 tooltip、highlight）。

```tsx
import { useRef } from 'react';
import { useEcharts } from 'react-use-echarts';

function LinkedCharts() {
  const chartRef1 = useRef<HTMLDivElement>(null);
  const chartRef2 = useRef<HTMLDivElement>(null);
  const xAxisData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEcharts(chartRef1, {
    option: {
      xAxis: { type: 'category', data: xAxisData },
      yAxis: { type: 'value' },
      tooltip: { trigger: 'axis' },
      series: [{ data: [120, 200, 150, 80, 70, 110, 130], type: 'line' }]
    },
    group: 'my-chart-group'
  });

  useEcharts(chartRef2, {
    option: {
      xAxis: { type: 'category', data: xAxisData },
      yAxis: { type: 'value' },
      tooltip: { trigger: 'axis' },
      series: [{ data: [220, 180, 191, 234, 290, 330, 310], type: 'bar' }]
    },
    group: 'my-chart-group'
  });

  return (
    <div>
      <div ref={chartRef1} style={{ width: '100%', height: '300px' }} />
      <div ref={chartRef2} style={{ width: '100%', height: '300px' }} />
    </div>
  );
}
```

### Lazy Initialization

当图表进入视口时才初始化，适合包含多个图表的页面。默认参数：`rootMargin: '50px'`，`threshold: 0.1`。

```tsx
import { useRef } from 'react';
import { useEcharts } from 'react-use-echarts';

// 使用默认配置
function LazyChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEcharts(chartRef, {
    option: {
      xAxis: { type: 'category', data: ['A', 'B', 'C'] },
      yAxis: { type: 'value' },
      series: [{ data: [120, 200, 150], type: 'bar' }]
    },
    lazyInit: true
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}

// 自定义 IntersectionObserver 配置
function LazyChartWithOptions() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEcharts(chartRef, {
    option: {
      xAxis: { type: 'category', data: ['A', 'B', 'C'] },
      yAxis: { type: 'value' },
      series: [{ data: [120, 200, 150], type: 'bar' }]
    },
    lazyInit: {
      rootMargin: '100px',
      threshold: 0.1
    }
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
```

### SVG Renderer

使用 SVG 渲染器以获得更好的可访问性和打印质量。

```tsx
import { useRef } from 'react';
import { useEcharts } from 'react-use-echarts';

function SVGChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEcharts(chartRef, {
    option: {
      xAxis: { type: 'category', data: ['A', 'B', 'C'] },
      yAxis: { type: 'value' },
      series: [{ data: [120, 200, 150], type: 'bar' }]
    },
    renderer: 'svg' // 默认为 'canvas'
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
```

### Accessing ECharts Instance

通过 `getInstance()` 获取 ECharts 实例，可执行导出图片等高级操作。

```tsx
import { useRef } from 'react';
import { useEcharts } from 'react-use-echarts';

function ChartWithInstance() {
  const chartRef = useRef<HTMLDivElement>(null);

  const { getInstance } = useEcharts(chartRef, {
    option: {
      xAxis: { type: 'category', data: ['A', 'B', 'C'] },
      yAxis: { type: 'value' },
      series: [{ data: [120, 200, 150], type: 'bar' }]
    }
  });

  const exportImage = () => {
    const instance = getInstance();
    if (instance) {
      const url = instance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
      const link = document.createElement('a');
      link.download = 'chart.png';
      link.href = url;
      link.click();
    }
  };

  return (
    <div>
      <button onClick={exportImage}>Export as Image</button>
      <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
    </div>
  );
}
```

### Manual Resize

手动触发图表尺寸调整（通常由 ResizeObserver 自动处理）。

```tsx
import { useRef } from 'react';
import { useEcharts } from 'react-use-echarts';

function ResizableChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  const { resize } = useEcharts(chartRef, {
    option: {
      xAxis: { type: 'category', data: ['A', 'B', 'C'] },
      yAxis: { type: 'value' },
      series: [{ data: [120, 200, 150], type: 'bar' }]
    }
  });

  return (
    <div>
      <button onClick={resize}>Trigger Resize</button>
      <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
    </div>
  );
}
```

### Utilities

高级场景可直接使用导出的工具函数：

```tsx
import {
  getCachedInstance,
  clearInstanceCache,
  getGroupInstances,
  updateGroup,
  addToGroup,
  removeFromGroup,
} from 'react-use-echarts';
```

- `getCachedInstance` / `clearInstanceCache`：查询或清理内部实例缓存
- `getGroupInstances` / `addToGroup` / `removeFromGroup` / `updateGroup`：手动管理 ECharts 组联动

## 📖 API

### useEcharts

在 React 组件中使用 ECharts 的主 Hook。

#### Parameters

```tsx
const chartRef = useRef<HTMLDivElement>(null);

const { setOption, getInstance, resize } = useEcharts(chartRef, {
  option: { /* EChartsOption */ }, // 必需
  theme: 'dark', // 'light' | 'dark' | 'macarons' | 自定义对象 | null
  renderer: 'canvas', // 'canvas' | 'svg'，默认 'canvas'
  lazyInit: false, // boolean | IntersectionObserverInit
  group: 'my-group', // 组 ID，用于图表联动
  setOptionOpts: { notMerge: false }, // setOption 的默认选项
  showLoading: false, // 是否显示加载状态
  loadingOption: { text: 'Loading…' }, // 加载配置
  onEvents: {
    click: {
      handler: (params) => console.log(params),
      query: 'series', // 可选：事件查询条件
    },
  },
});
```

#### Options

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `option` | `EChartsOption` | **必需** | ECharts 配置选项 |
| `theme` | `'light' \| 'dark' \| 'macarons' \| object \| null` | `null` | 主题名称或自定义主题对象 |
| `renderer` | `'canvas' \| 'svg'` | `'canvas'` | 渲染器类型 |
| `lazyInit` | `boolean \| IntersectionObserverInit` | `false` | 懒加载配置 |
| `group` | `string` | - | 图表联动组 ID |
| `setOptionOpts` | `SetOptionOpts` | - | setOption 的默认选项 |
| `showLoading` | `boolean` | `false` | 是否显示加载状态 |
| `loadingOption` | `object` | - | 加载配置 |
| `onEvents` | `EChartsEvents` | - | 事件处理器 |

#### Returns

```tsx
{
  setOption: (option: EChartsOption, opts?: SetOptionOpts) => void;
  getInstance: () => ECharts | undefined;
  resize: () => void;
}
```

- **`setOption`**: 动态更新图表配置
- **`getInstance`**: 获取 ECharts 实例（初始化前返回 `undefined`）
- **`resize`**: 手动触发图表尺寸调整

### Theme Utilities

```tsx
import {
  getAvailableThemes,
  isBuiltinTheme,
  getBuiltinTheme,
  registerCustomTheme,
  registerBuiltinThemes,
} from 'react-use-echarts';

getAvailableThemes(); // ['light', 'dark', 'macarons']
isBuiltinTheme('dark'); // true
getBuiltinTheme('dark'); // 获取内置主题配置
registerCustomTheme('my-theme', { color: ['#ff0000', '#00ff00'] }); // 注册自定义主题
registerBuiltinThemes(); // 注册内置主题（模块加载时自动调用，通常无需手动调用）
```

### useLazyInit

独立的懒加载 Hook，基于 IntersectionObserver。

```tsx
import { useRef } from 'react';
import { useLazyInit } from 'react-use-echarts';

function MyComponent() {
  const elementRef = useRef<HTMLDivElement>(null);
  const isInView = useLazyInit(elementRef, {
    rootMargin: '50px',
    threshold: 0.1
  });

  return (
    <div ref={elementRef}>
      {isInView ? <ExpensiveComponent /> : <Placeholder />}
    </div>
  );
}
```

## 🤝 Contributing

We welcome all contributions. Please read our [contributing guidelines](CONTRIBUTING.md) first. You can submit any ideas as [pull requests](https://github.com/chensid/react-use-echarts/pulls) or as [GitHub issues](https://github.com/chensid/react-use-echarts/issues).

## 🔄 Migration Guide

### From v0.0.11 to v1.0

#### Breaking Change: External Ref Management

`useEcharts` 不再返回 `chartRef`，需要外部创建和管理 ref：

**Before (v0.0.11):**

```tsx
const { chartRef, setOption, getInstance } = useEcharts({
  option: { /* ... */ }
});
```

**After (v1.0):**

```tsx
const chartRef = useRef<HTMLDivElement>(null);
const { setOption, getInstance, resize } = useEcharts(chartRef, {
  option: { /* ... */ }
});
```

#### New Features in v1.0

- 内置主题：`theme: 'light' | 'dark' | 'macarons'` 或自定义主题对象
- 图表联动：使用 `group` 选项连接多个图表
- 懒加载：`lazyInit: true` 或自定义 `IntersectionObserverInit` 配置
- SVG 渲染器：`renderer: 'svg'` 提升可访问性和打印质量
- 手动调整尺寸：新增 `resize()` 方法

#### Custom Theme 注意事项

使用自定义主题对象时，建议使用 `useMemo` 避免不必要的图表重建（见上方 Themes 示例）。

### v1.0.2

- 主题切换后保留组联动与 loading 状态
- 懒加载完成后正确加入组
- onEvents 变更时自动重绑事件
- 文档补充实例缓存与组联动工具导出

## 📝 Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/chensid/react-use-echarts/releases).

## 📄 License

[MIT](./LICENSE.txt) © [Ethan](https://github.com/chensid)
