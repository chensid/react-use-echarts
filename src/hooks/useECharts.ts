import { useEffect, useRef, useCallback } from "react";
import * as echarts from "echarts";
import type { EChartsOption, SetOptionOpts } from "echarts";
import type { UseEChartsOptions, UseEChartsReturn } from "../types";

/**
 * A React hook for using Apache ECharts
 * React Hook 用于使用 Apache ECharts
 * 
 * @param options - Configuration options for the chart
 * @param options.option - Chart configuration options
 * @param options.theme - Chart theme
 * @param options.notMerge - Whether to merge options or not
 * @param options.lazyUpdate - Whether to update chart lazily or not
 * @param options.showLoading - Whether to show loading animation or not
 * @param options.loadingOption - Loading animation configuration options
 * @param options.onEvents - Event handlers for the chart
 * @returns Object containing chart reference and control functions
 * 
 * @example
 * ```typescript
 * const { chartRef, setOption, getInstance } = useECharts({
 *   option: {
 *     xAxis: { type: 'category', data: ['A', 'B', 'C'] },
 *     yAxis: { type: 'value' },
 *     series: [{ data: [120, 200, 150], type: 'line' }]
 *   },
 *   onEvents: {
 *     'click': {
 *       handler: (params) => console.log('clicked', params)
 *     }
 *   }
 * });
 * 
 * return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
 * ```
 */
const useECharts = ({
  /**
   * Chart configuration options
   * 图表配置选项
   */
  option,
  /**
   * Chart theme
   * 图表主题
   */
  theme,
  /**
   * Whether to merge options or not
   * 是否合并选项
   * @default false
   */
  notMerge = false,
  /**
   * Whether to update chart lazily or not
   * 是否懒更新图表
   * @default false
   */
  lazyUpdate = false,
  /**
   * Whether to show loading animation or not
   * 是否显示加载动画
   * @default false
   */
  showLoading = false,
  /**
   * Loading animation configuration options
   * 加载动画配置选项
   */
  loadingOption,
  /**
   * Event handlers for the chart
   * 图表事件处理函数
   */
  onEvents,
}: UseEChartsOptions): UseEChartsReturn => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts>();

  /**
   * Get chart instance
   * 获取图表实例
   */
  const getInstance = useCallback(() => chartInstance.current, []);

  /**
   * Update chart options
   * 更新图表配置
   * 
   * @param option - New chart configuration options
   * @param opts - Update options
   */
  const setOption = useCallback(
    (option: EChartsOption, opts?: SetOptionOpts) => {
      chartInstance.current?.setOption(option, opts);
    },
    []
  );

  /**
   * Initialize chart
   * 初始化图表
   */
  useEffect(() => {
    if (!chartRef.current) return;

    // Create instance
    // 创建实例
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, theme);
    }

    // Bind events
    // 绑定事件
    if (onEvents && chartInstance.current) {
      Object.entries(onEvents).forEach(([eventName, eventConfig]) => {
        const { handler, query, context } = eventConfig;
        if (query) {
          chartInstance.current?.on(eventName, query, handler, context);
        } else {
          chartInstance.current?.on(eventName, handler, context);
        }
      });
    }

    // Cleanup function
    // 清理函数
    return () => {
      if (chartInstance.current) {
        // Unbind events
        // 解绑事件
        if (onEvents) {
          Object.entries(onEvents).forEach(([eventName, eventConfig]) => {
            const { handler } = eventConfig;
            chartInstance.current?.off(eventName, handler);
          });
        }
        // Dispose instance
        // 销毁实例
        chartInstance.current.dispose();
        chartInstance.current = undefined;
      }
    };
  }, [theme, onEvents]);

  /**
   * Update options
   * 更新配置
   */
  useEffect(() => {
    if (chartInstance.current) {
      // Handle loading state
      // 处理加载状态
      if (showLoading) {
        chartInstance.current.showLoading(loadingOption);
      } else {
        chartInstance.current.hideLoading();
      }
      
      // Update options
      // 更新配置
      chartInstance.current.setOption(option, { 
        notMerge, 
        lazyUpdate 
      });
    }
  }, [option, notMerge, lazyUpdate, showLoading, loadingOption]);

  /**
   * Handle window resize
   * 处理窗口大小变化
   */
  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    chartRef,
    setOption,
    getInstance,
  };
};

export default useECharts;
