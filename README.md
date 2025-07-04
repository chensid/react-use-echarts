# react-use-echarts

[![NPM version](https://img.shields.io/npm/v/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![NPM downloads](https://img.shields.io/npm/dm/react-use-echarts.svg)](https://www.npmjs.com/package/react-use-echarts)
[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/chensid/react-use-echarts/npm-publish.yml)](https://github.com/chensid/react-use-echarts/actions/workflows/npm-publish.yml)
[![GitHub issues](https://img.shields.io/github/issues/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/chensid/react-use-echarts)](https://github.com/chensid/react-use-echarts/pulls)
[![GitHub license](https://img.shields.io/github/license/chensid/react-use-echarts.svg)](https://github.com/chensid/react-use-echarts/blob/main/LICENSE.txt)

A powerful React hooks library for Apache ECharts, making it easy to use ECharts in your React applications with minimal boilerplate.

## ✨ Features

- 🎨 **Easy to use** - Simple and intuitive API with React Hooks
- 🚀 **TypeScript support** - Written in TypeScript with complete type definitions
- 📦 **Lightweight** - Zero dependencies except for React and ECharts
- 🛠 **Flexible** - Full access to ECharts instance and options
- ⚡ **Auto-updating** - Automatically updates chart when data or options change
- 📱 **Responsive** - Handles container resizing automatically with ResizeObserver
- 🎯 **Event handling** - Easy to use event system with flexible configuration

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

## 📖 API

### useEcharts

The main hook for using ECharts in React components.

```tsx
import type { EChartsOption } from 'echarts';
import type { UseEchartsOptions } from 'react-use-echarts';

const { chartRef, setOption, getInstance } = useEcharts({
  option: EChartsOption;        // ECharts options configuration (required)
  theme?: string | object;      // ECharts theme name or configuration
  notMerge?: boolean;          // Whether to not merge with previous options
  lazyUpdate?: boolean;        // Whether to update chart lazily
  showLoading?: boolean;       // Whether to display loading animation
  loadingOption?: object;      // Loading animation configuration
  onEvents?: {                 // Event handlers
    [eventName: string]: {
      handler: (params: any) => void;
      query?: string | object;
      context?: object;
    }
  }
});
```

#### Returns

- `chartRef`: Ref object to attach to the chart container
- `setOption`: Function to update chart options
- `getInstance`: Function to get the ECharts instance (available after component mounts)

## 🤝 Contributing

We welcome all contributions. Please read our [contributing guidelines](CONTRIBUTING.md) first. You can submit any ideas as [pull requests](https://github.com/chensid/react-use-echarts/pulls) or as [GitHub issues](https://github.com/chensid/react-use-echarts/issues).

## 📝 Changelog

Detailed changes for each release are documented in the [release notes](https://github.com/chensid/react-use-echarts/releases).

## 📄 License

[MIT](./LICENSE.txt) © [chin](https://github.com/chensid)
