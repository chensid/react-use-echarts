import { useEffect, useRef, useCallback } from "react";
import * as echarts from "echarts";
import type { ECharts, EChartsOption, SetOptionOpts } from "echarts";
import type { UseEchartsOptions, UseEchartsReturn } from "../types";

/**
 * React hook for Apache ECharts integration
 * @param options Configuration object
 * @param options.option Chart configuration
 * @param options.theme Chart theme name
 * @param options.notMerge Skip merging with previous options
 * @param options.lazyUpdate Enable lazy update mode
 * @param options.showLoading Display loading animation
 * @param options.loadingOption Loading animation config
 * @param options.onEvents Event handlers map
 * @returns Chart control methods and ref
 */
const useEcharts = ({
  /** Chart configuration */
  option,
  /** Theme name */
  theme,
  /** Skip merging with previous options */
  notMerge = false,
  /** Enable lazy update mode */
  lazyUpdate = false,
  /** Display loading animation */
  showLoading = false,
  /** Loading animation config */
  loadingOption,
  /** Event handlers map */
  onEvents,
}: UseEchartsOptions): UseEchartsReturn => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | undefined>(undefined);

  /**
   * Get the current chart instance
   */
  const getInstance = () => chartInstance.current;

  /**
   * Initialize the chart instance and bind events
   */
  const initChartConfig = useCallback(() => ({
    option,
    theme,
    notMerge,
    lazyUpdate,
    showLoading,
    loadingOption,
    onEvents,
  }), [
    option,
    theme,
    notMerge,
    lazyUpdate,
    showLoading,
    loadingOption,
    onEvents,
  ]);

  const initChart = useCallback(() => {
    if (chartRef.current && !chartInstance.current) {
      const instance = echarts.init(chartRef.current, theme);
      chartInstance.current = instance;
      
      const config = initChartConfig();

      if (config.onEvents) {
        Object.entries(config.onEvents).forEach(
          ([eventName, { handler, query, context }]) => {
            if (query) {
              instance.on(eventName, query, handler, context);
            } else {
              instance.on(eventName, handler, context);
            }
          }
        );
      }

      if (config.showLoading) {
        instance.showLoading(config.loadingOption);
      } else {
        instance.hideLoading();
      }
      instance.setOption(config.option, { 
        notMerge: config.notMerge, 
        lazyUpdate: config.lazyUpdate 
      });

      return instance;
    }
    return chartInstance.current;
  }, [initChartConfig, theme]);

  /**
   * Set new options for the chart
   */
  const setOption = useCallback(
    (newOption: EChartsOption, opts?: SetOptionOpts) => {
      queueMicrotask(() => {
        const instance = chartInstance.current || initChart();
        if (instance) {
          instance.setOption(newOption, opts);
        }
      });
    },
    [initChart]
  );

  /**
   * Handle chart resize and cleanup
   */
  useEffect(() => {
    const instance = chartInstance.current;
    if (!instance) return;

    let resizeTimer: number;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        instance?.resize();
      }, 250);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
      
      if (onEvents && instance) {
        Object.entries(onEvents).forEach(([eventName, { handler }]) => {
          instance.off(eventName, handler);
        });
      }

      instance.dispose();
      chartInstance.current = undefined;
    };
  }, [onEvents]);

  /**
   * Initialize chart on chartRef changes
   */
  useEffect(() => {
    if (chartRef.current) {
      queueMicrotask(initChart);
    }
  }, [chartRef, initChart]);

  return {
    chartRef,
    setOption,
    getInstance,
  };
};

export default useEcharts;
