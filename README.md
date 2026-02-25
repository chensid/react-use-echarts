# react-use-echarts

> [中文](./README.zh-CN.md) | [English](./README.md)

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

Built-in themes: `light`, `dark`, `macarons`, or pass a custom theme object.

```tsx
import { useRef, useMemo } from 'react';
import { useEcharts } from 'react-use-echarts';

// Using built-in theme
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

// Using custom theme (recommend using useMemo to avoid unnecessary re-renders)
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

Connect multiple charts using the `group` option to enable synchronized interactions (e.g., tooltip, highlight).

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

Initialize charts only when they enter the viewport. Suitable for pages with multiple charts. Default parameters: `rootMargin: '50px'`, `threshold: 0.1`.

```tsx
import { useRef } from 'react';
import { useEcharts } from 'react-use-echarts';

// Using default configuration
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

// Custom IntersectionObserver configuration
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

Use SVG renderer for better accessibility and print quality.

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
    renderer: 'svg' // Default is 'canvas'
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
```

### Accessing ECharts Instance

Access the ECharts instance via `getInstance()` to perform advanced operations like exporting images.

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

Manually trigger chart resize (usually handled automatically by ResizeObserver).

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

Advanced scenarios can directly use exported utility functions:

```tsx
import {
  // Instance cache utilities
  getCachedInstance,
  setCachedInstance,
  replaceCachedInstance,
  releaseCachedInstance,
  getReferenceCount,
  clearInstanceCache,
  // Group linkage utilities
  addToGroup,
  removeFromGroup,
  updateGroup,
  getGroupInstances,
  getInstanceGroup,
  isInGroup,
  clearGroups,
} from 'react-use-echarts';
```

- `getCachedInstance` / `setCachedInstance` / `replaceCachedInstance` / `releaseCachedInstance` / `getReferenceCount` / `clearInstanceCache`: Query, set, replace, release, count references, or clear internal instance cache
- `addToGroup` / `removeFromGroup` / `updateGroup` / `getGroupInstances` / `getInstanceGroup` / `isInGroup` / `clearGroups`: Manually manage ECharts group linkage

## 📖 API

### useEcharts

The main Hook for using ECharts in React components.

#### Parameters

```tsx
const chartRef = useRef<HTMLDivElement>(null);

const { setOption, getInstance, resize } = useEcharts(chartRef, {
  option: { /* EChartsOption */ }, // Required
  theme: 'dark', // 'light' | 'dark' | 'macarons' | custom object | null
  renderer: 'canvas', // 'canvas' | 'svg', default 'canvas'
  lazyInit: false, // boolean | IntersectionObserverInit
  group: 'my-group', // Group ID for chart linkage
  setOptionOpts: { notMerge: false }, // Default options for setOption
  showLoading: false, // Whether to show loading state
  loadingOption: { text: 'Loading…' }, // Loading configuration
  autoResize: true, // Auto-resize via ResizeObserver, default true
  initOpts: { devicePixelRatio: 2 }, // Options passed to echarts.init()
  onError: (err) => console.error(err), // Error handler for chart operations
  onEvents: {
    click: {
      handler: (params) => console.log(params),
      query: 'series', // Optional: event query condition
    },
  },
});
```

#### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `option` | `EChartsOption` | **Required** | ECharts configuration option |
| `theme` | `'light' \| 'dark' \| 'macarons' \| object \| null` | `null` | Theme name or custom theme object |
| `renderer` | `'canvas' \| 'svg'` | `'canvas'` | Renderer type |
| `lazyInit` | `boolean \| IntersectionObserverInit` | `false` | Lazy initialization configuration |
| `group` | `string` | - | Chart linkage group ID |
| `setOptionOpts` | `SetOptionOpts` | - | Default options for setOption |
| `showLoading` | `boolean` | `false` | Whether to show loading state |
| `loadingOption` | `object` | - | Loading configuration |
| `onEvents` | `EChartsEvents` | - | Event handlers |
| `autoResize` | `boolean` | `true` | Auto-resize chart via ResizeObserver |
| `initOpts` | `EChartsInitOpts` | - | Options passed to `echarts.init()`: devicePixelRatio, locale, width, height; useDirtyRect (dirty rect optimization, 5.0+), useCoarsePointer (mobile pointer capture, 5.4+), pointerSize (pointer radius, default 44px, 5.4+) |
| `onError` | `(error: unknown) => void` | - | Error handler for chart operations (init, setOption, etc.) |

#### Returns

```tsx
{
  setOption: (option: EChartsOption, opts?: SetOptionOpts) => void;
  getInstance: () => ECharts | undefined;
  resize: () => void;
}
```

- **`setOption`**: Dynamically update chart configuration
- **`getInstance`**: Get ECharts instance (returns `undefined` before initialization)
- **`resize`**: Manually trigger chart resize

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
getBuiltinTheme('dark'); // Get built-in theme configuration
registerCustomTheme('my-theme', { color: ['#ff0000', '#00ff00'] }); // Register custom theme
registerBuiltinThemes(); // Register built-in themes (automatically called on module load, usually no need to call manually)
```

### useLazyInit

Standalone lazy initialization Hook based on IntersectionObserver.

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

## 📝 Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/chensid/react-use-echarts/releases).

## 📄 License

[MIT](./LICENSE.txt) © [Ethan](https://github.com/chensid)
