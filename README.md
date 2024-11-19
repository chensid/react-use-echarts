# react-use-echarts

A powerful React hooks library for Apache ECharts, making it easy to use ECharts in your React applications.

## Features

- **Easy to use** - Simple and intuitive API
- **TypeScript support** - Written in TypeScript with complete type definitions
- **Lightweight** - Zero dependencies except for React and ECharts
- **Flexible** - Full access to ECharts instance and options
- **Auto-updating** - Automatically updates chart when data or options change
- **Responsive** - Handles container resizing automatically

## Installation

```bash
# Using npm
npm install react-use-echarts echarts

# Using yarn
yarn add react-use-echarts echarts

# Using pnpm
pnpm add react-use-echarts echarts
```

## Usage

```tsx
import { useECharts } from 'react-use-echarts';

function MyChart() {
  const options = {
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [820, 932, 901, 934, 1290, 1330, 1320],
      type: 'line'
    }]
  };

  const { chartRef } = useECharts(options);

  return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
}
```

## API

### useECharts

The main hook for using ECharts in React components.

```tsx
const { chartRef, instance, setOption } = useECharts(options, theme?, opts?);
```

#### Parameters

- `options` (required): ECharts options configuration
- `theme` (optional): ECharts theme name or configuration
- `opts` (optional): ECharts initialization options

#### Returns

- `chartRef`: Ref object to attach to the chart container
- `instance`: ECharts instance (available after component mounts)
- `setOption`: Function to update chart options

## License

MIT [chin](https://github.com/chensid)
