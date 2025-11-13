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

## 📋 Requirements

- React 19.x
- ECharts 6.x

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
import React from 'react';
import { useEcharts } from 'react-use-echarts';
import type { EChartsOption } from 'echarts';

function MyChart() {
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

  const { chartRef } = useEcharts({
    option: options
  });

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
```

## 🚀 Advanced Usage

### Event Handling

```tsx
import { useEcharts } from 'react-use-echarts';
import type { EChartsOption } from 'echarts';

function InteractiveChart() {
  const options: EChartsOption = {
    xAxis: { type: 'category', data: ['A', 'B', 'C'] },
    yAxis: { type: 'value' },
    series: [{ data: [120, 200, 150], type: 'bar' }]
  };

  const { chartRef } = useEcharts({
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
import { useState, useEffect } from 'react';
import { useEcharts } from 'react-use-echarts';

function ChartWithLoading() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  // Simulate data fetching
  useEffect(() => {
    setTimeout(() => {
      setData([820, 932, 901, 934, 1290, 1330, 1320]);
      setLoading(false);
    }, 2000);
  }, []);

  const { chartRef } = useEcharts({
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
import { useState } from 'react';
import { useEcharts } from 'react-use-echarts';

function DynamicChart() {
  const [data, setData] = useState([120, 200, 150, 80, 70, 110, 130]);

  const { chartRef, setOption } = useEcharts({
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

### Custom Theme

```tsx
import { useEcharts } from 'react-use-echarts';

function ThemedChart() {
  const customTheme = {
    color: ['#fc8452', '#9a60b4', '#ea7ccc'],
    backgroundColor: '#1e1e1e'
  };

  const { chartRef } = useEcharts({
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

### Accessing ECharts Instance

```tsx
import { useEcharts } from 'react-use-echarts';

function ChartWithInstance() {
  const { chartRef, getInstance } = useEcharts({
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

## 📖 API

### useEcharts

The main hook for using ECharts in React components.

#### Parameters

```tsx
import type { EChartsOption, SetOptionOpts } from 'echarts';
import { useEcharts } from 'react-use-echarts';

const { chartRef, setOption, getInstance } = useEcharts({
  option: EChartsOption;        // Required: ECharts configuration
  theme?: string | object;      // Optional: Theme name or object
  notMerge?: boolean;          // Optional: Don't merge with previous option (default: false)
  lazyUpdate?: boolean;        // Optional: Lazy update mode (default: false)
  showLoading?: boolean;       // Optional: Show loading animation (default: false)
  loadingOption?: object;      // Optional: Loading animation config
  onEvents?: {                 // Optional: Event handlers map
    [eventName: string]: {
      handler: (params: unknown) => void;
      query?: string | object;
      context?: object;
    }
  }
});
```

#### Returns

```tsx
{
  chartRef: React.RefObject<HTMLDivElement | null>;
  setOption: (option: EChartsOption, opts?: SetOptionOpts) => void;
  getInstance: () => ECharts | undefined;
}
```

- **`chartRef`**: Ref to attach to the chart container element
- **`setOption`**: Update chart options dynamically
- **`getInstance`**: Get the ECharts instance (returns `undefined` before initialization)

## 🤝 Contributing

We welcome all contributions. Please read our [contributing guidelines](CONTRIBUTING.md) first. You can submit any ideas as [pull requests](https://github.com/chensid/react-use-echarts/pulls) or as [GitHub issues](https://github.com/chensid/react-use-echarts/issues).

## 📝 Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/chensid/react-use-echarts/releases).

## 📄 License

[MIT](./LICENSE.txt) © [Ethan](https://github.com/chensid)
