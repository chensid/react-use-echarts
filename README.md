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

  const options: EChartsOption = {
    title: {
      text: 'Basic Line Chart Example'
    },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [820, 932, 901, 934, 1290, 1330, 1320],
      type: 'line',
      smooth: true
    }]
  };

  useEcharts(chartRef, {
    option: options
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

### Built-in Themes

The library includes three built-in themes: `light`, `dark`, and `macarons`.

```tsx
import { useRef } from 'react';
import { useEcharts } from 'react-use-echarts';

function ThemedChart() {
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
```

### Custom Theme

```tsx
import { useRef } from 'react';
import { useEcharts } from 'react-use-echarts';

function CustomThemedChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  const customTheme = {
    color: ['#fc8452', '#9a60b4', '#ea7ccc'],
    backgroundColor: '#1e1e1e'
  };

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

Connect multiple charts to synchronize their interactions (e.g., tooltip, highlight).

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

Only initialize charts when they enter the viewport, great for pages with many charts.

```tsx
import { useRef } from 'react';
import { useEcharts } from 'react-use-echarts';

function LazyChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEcharts(chartRef, {
    option: {
      xAxis: { type: 'category', data: ['A', 'B', 'C'] },
      yAxis: { type: 'value' },
      series: [{ data: [120, 200, 150], type: 'bar' }]
    },
    lazyInit: true // Chart will only initialize when scrolled into view
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}

// With custom IntersectionObserver options
function LazyChartWithOptions() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEcharts(chartRef, {
    option: {
      xAxis: { type: 'category', data: ['A', 'B', 'C'] },
      yAxis: { type: 'value' },
      series: [{ data: [120, 200, 150], type: 'bar' }]
    },
    lazyInit: {
      rootMargin: '100px', // Pre-load when 100px away from viewport
      threshold: 0.1
    }
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
```

### SVG Renderer

Use SVG renderer instead of Canvas for better accessibility and print quality.

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
    renderer: 'svg'
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
```

### Accessing ECharts Instance

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
      const url = instance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      // Download or use the image URL
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

  // Manually trigger resize after some container size change
  const handleContainerResize = () => {
    resize();
  };

  return (
    <div>
      <button onClick={handleContainerResize}>Trigger Resize</button>
      <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
    </div>
  );
}
```

## 📖 API

### useEcharts

The main hook for using ECharts in React components.

#### Parameters

```tsx
import { useRef } from 'react';
import type { EChartsOption } from 'echarts';
import type { UseEchartsOptions } from 'react-use-echarts';
import { useEcharts } from 'react-use-echarts';

const chartRef = useRef<HTMLDivElement>(null);

const someEchartsOption: EChartsOption = {
  xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed'] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', data: [120, 200, 150] }],
};

const options: UseEchartsOptions = {
  option: someEchartsOption, // Required: ECharts options
  theme: 'dark', // Optional: 'light' | 'dark' | 'macarons' | custom object | null
  renderer: 'canvas', // Optional: 'canvas' | 'svg' (default: 'canvas')
  lazyInit: false, // Optional: boolean | IntersectionObserverInit
  group: 'my-group', // Optional: Group ID for chart linkage
  setOptionOpts: { notMerge: false }, // Optional: Default setOption options
  showLoading: false, // Optional: Show loading state
  loadingOption: { text: 'Loading…' }, // Optional: Loading options
  onEvents: {
    click: {
      handler: (params) => {
        console.log(params);
      },
      query: 'series', // Optional: Event query
    },
  },
};

const { setOption, getInstance, resize } = useEcharts(chartRef, options);
```

#### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `option` | `EChartsOption` | **required** | ECharts configuration options |
| `theme` | `'light' \| 'dark' \| 'macarons' \| object \| null` | `null` | Theme name or custom theme object |
| `renderer` | `'canvas' \| 'svg'` | `'canvas'` | Renderer type |
| `lazyInit` | `boolean \| IntersectionObserverInit` | `false` | Lazy initialization config |
| `group` | `string` | - | Group ID for chart linkage |
| `setOptionOpts` | `SetOptionOpts` | - | Default options for setOption |
| `showLoading` | `boolean` | `false` | Show loading state |
| `loadingOption` | `object` | - | Loading configuration |
| `onEvents` | `EChartsEvents` | - | Event handlers |

#### Returns

```tsx
{
  setOption: (option: EChartsOption, opts?: SetOptionOpts) => void;
  getInstance: () => ECharts | undefined;
  resize: () => void;
}
```

- **`setOption`**: Update chart options dynamically
- **`getInstance`**: Get the ECharts instance (returns `undefined` before initialization)
- **`resize`**: Manually trigger chart resize

### Theme Utilities

```tsx
import {
  registerBuiltinThemes,
  getBuiltinTheme,
  isBuiltinTheme,
  registerCustomTheme,
  getAvailableThemes,
} from 'react-use-echarts';

// Get all available built-in theme names
const themes = getAvailableThemes(); // ['light', 'dark', 'macarons']

// Check if a theme name is built-in
isBuiltinTheme('dark'); // true
isBuiltinTheme('custom'); // false

// Get built-in theme configuration
const darkTheme = getBuiltinTheme('dark');

// Register a custom theme globally
registerCustomTheme('my-theme', { color: ['#ff0000', '#00ff00'] });
```

### useLazyInit

A standalone hook for lazy initialization using IntersectionObserver.

```tsx
import { useRef } from 'react';
import { useLazyInit } from 'react-use-echarts';

function MyComponent() {
  const elementRef = useRef<HTMLDivElement>(null);

  // Returns true when element enters viewport
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

The `useEcharts` hook no longer returns a `chartRef`. Instead, you now create and manage the ref externally:

**Before (v0.0.11):**
```tsx
import { useEcharts } from 'react-use-echarts';

function MyChart() {
  const { chartRef, setOption, getInstance } = useEcharts({
    option: { /* ... */ }
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
```

**After (v1.0):**
```tsx
import { useRef } from 'react';
import { useEcharts } from 'react-use-echarts';

function MyChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  const { setOption, getInstance, resize } = useEcharts(chartRef, {
    option: { /* ... */ }
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
```

#### New Features in v1.0

- **Built-in themes**: Use `theme: 'light' | 'dark' | 'macarons'` or pass a custom theme object
- **Chart linkage**: Connect charts using the `group` option
- **Lazy initialization**: Use `lazyInit: true` or custom `IntersectionObserverInit` options
- **SVG renderer**: Use `renderer: 'svg'` for better accessibility and print quality
- **Manual resize**: New `resize()` function returned from the hook

#### Important Notes for Custom Themes

When using custom theme objects, **memoize them** to avoid unnecessary chart recreation:

```tsx
import { useRef, useMemo } from 'react';
import { useEcharts } from 'react-use-echarts';

function MyChart() {
  const chartRef = useRef<HTMLDivElement>(null);

  // ✅ Good: Memoized theme object
  const customTheme = useMemo(() => ({
    color: ['#fc8452', '#9a60b4', '#ea7ccc'],
    backgroundColor: '#1e1e1e'
  }), []);

  useEcharts(chartRef, {
    option: { /* ... */ },
    theme: customTheme
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
```

## 📝 Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/chensid/react-use-echarts/releases).

## 📄 License

[MIT](./LICENSE.txt) © [Ethan](https://github.com/chensid)
