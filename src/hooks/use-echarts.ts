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
  const chartInstance = useRef<ECharts>();

  /**
   * Get the current chart instance
   */
  const getInstance = () => chartInstance.current;

  /**
   * Initialize the chart instance and bind events
   */
  const initChart = useCallback(() => {
    if (chartRef.current && !chartInstance.current) {
      const instance = echarts.init(chartRef.current, theme);
      chartInstance.current = instance;

      // Bind events if provided
      if (onEvents) {
        Object.entries(onEvents).forEach(
          ([eventName, { handler, query, context }]) => {
            if (query) {
              instance.on(eventName, query, handler, context);
            } else {
              instance.on(eventName, handler, context);
            }
          }
        );
      }

      // Apply initial options
      if (showLoading) {
        instance.showLoading(loadingOption);
      } else {
        instance.hideLoading();
      }
      instance.setOption(option, { notMerge, lazyUpdate });

      return instance;
    }
    return chartInstance.current;
  }, [
    option,
    theme,
    notMerge,
    lazyUpdate,
    showLoading,
    loadingOption,
    onEvents,
  ]);

  /**
   * Set new options for the chart
   */
  const setOption = useCallback(
    (newOption: EChartsOption, opts?: SetOptionOpts) => {
      requestAnimationFrame(() => {
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

    // Debounced resize handling
    const handleResize = () => {
      const resizeTimer = setTimeout(() => {
        instance?.resize();
      }, 250);
      return () => clearTimeout(resizeTimer);
    };

    const resizeCleanup = handleResize();
    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => {
      // Unbind events
      if (onEvents) {
        Object.entries(onEvents).forEach(([eventName, { handler }]) => {
          instance.off(eventName, handler);
        });
      }

      // Remove resize listener
      window.removeEventListener("resize", handleResize);

      // Dispose instance
      instance.dispose();
      chartInstance.current = undefined;

      // Clear resize timer
      resizeCleanup();
    };
  }, [onEvents]);

  /**
   * Initialize chart on chartRef changes
   */
  useEffect(() => {
    if (chartRef.current) {
      requestAnimationFrame(() => {
        initChart();
      });
    }
  }, [chartRef, initChart]);

  return {
    chartRef,
    setOption,
    getInstance,
  };
};

export default useEcharts;
