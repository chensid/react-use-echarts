import { useEffect, useRef, useCallback, useLayoutEffect } from "react";
import * as echarts from "echarts";
import type { ECharts, SetOptionOpts, EChartsOption } from "echarts";
import type { UseEchartsOptions, UseEchartsReturn, BuiltinTheme } from "../types";
import { useLazyInit } from "./use-lazy-init";
import {
  getCachedInstance,
  setCachedInstance,
  replaceCachedInstance,
  releaseCachedInstance,
} from "../utils/instance-cache";
import { updateGroup } from "../utils/connect";
import { isBuiltinTheme, registerCustomTheme } from "../themes";

/**
 * React hook for Apache ECharts integration (v1.0)
 * Apache ECharts React Hook (v1.0)
 * @param ref React ref to the chart container element
 * @param options Configuration options
 * @returns Chart control methods
 */
function useEcharts(
  ref: React.RefObject<HTMLDivElement | null>,
  options: UseEchartsOptions
): UseEchartsReturn {
  const {
    option,
    theme,
    renderer = 'canvas',
    lazyInit = false,
    group,
    setOptionOpts,
    showLoading = false,
    loadingOption,
    onEvents,
  } = options;

  // Track previous values for cleanup
  // 跟踪前值用于清理
  const prevGroupRef = useRef<string | undefined>(undefined);
  const prevThemeRef = useRef<BuiltinTheme | object | null | undefined>(undefined);

  // Lazy initialization
  // 懒加载初始化
  const shouldInit = useLazyInit(ref, typeof lazyInit === 'boolean' ? lazyInit : lazyInit || {});

  /**
   * Get the current chart instance
   * 获取当前图表实例
   */
  const getInstance = useCallback((): ECharts | undefined => {
    if (!ref.current) return undefined;
    return getCachedInstance(ref.current);
  }, [ref]);

  /**
   * Initialize or get cached chart instance
   * 初始化或获取缓存的图表实例
   */
  const initChart = useCallback((): ECharts | undefined => {
    const element = ref.current;
    if (!element || !shouldInit) return undefined;

    // Try to get cached instance
    // 尝试获取缓存实例
    let instance = getCachedInstance(element);

    if (!instance) {
      // Determine theme to use
      // 确定使用的主题
      let themeToUse: string | object | null = null;

      if (theme === null) {
        themeToUse = null;
      } else if (typeof theme === 'string' && isBuiltinTheme(theme)) {
        themeToUse = theme;
      } else if (typeof theme === 'object') {
        // Register custom theme
        // 注册自定义主题
        const customThemeName = `__custom_${Date.now()}_${Math.random()}`;
        registerCustomTheme(customThemeName, theme);
        themeToUse = customThemeName;
      }

      // Create new instance
      // 创建新实例
      instance = echarts.init(element, themeToUse, { renderer });

      // Cache the instance
      // 缓存实例
      setCachedInstance(element, instance);

      // Store current theme for comparison
      // 存储当前主题用于比较
      prevThemeRef.current = theme;
    } else if (prevThemeRef.current !== theme) {
      // Theme changed, need to recreate instance
      // 主题改变，需要重新创建实例
      instance.dispose();

      let themeToUse: string | object | null = null;

      if (theme === null) {
        themeToUse = null;
      } else if (typeof theme === 'string' && isBuiltinTheme(theme)) {
        themeToUse = theme;
      } else if (typeof theme === 'object') {
        const customThemeName = `__custom_${Date.now()}_${Math.random()}`;
        registerCustomTheme(customThemeName, theme);
        themeToUse = customThemeName;
      }

      instance = echarts.init(element, themeToUse, { renderer });
      replaceCachedInstance(element, instance);
      prevThemeRef.current = theme;
    }

    return instance;
  }, [ref, shouldInit, theme, renderer]);

  /**
   * Set chart options
   * 设置图表配置
   */
  const setOption = useCallback(
    (newOption: EChartsOption, opts?: SetOptionOpts) => {
      queueMicrotask(() => {
        const instance = getInstance() || initChart();
        if (instance) {
          const finalOpts = { ...setOptionOpts, ...opts };
          instance.setOption(newOption, finalOpts);
        }
      });
    },
    [getInstance, initChart, setOptionOpts]
  );

  /**
   * Manually trigger resize
   * 手动触发 resize
   */
  const resize = useCallback(() => {
    const instance = getInstance();
    if (instance) {
      instance.resize();
    }
  }, [getInstance]);

  /**
   * Setup chart instance when shouldInit becomes true
   * 当 shouldInit 变为 true 时设置图表实例
   */
  useLayoutEffect(() => {
    if (!shouldInit) return;

    const instance = initChart();
    if (!instance) return;

    // Set initial options
    // 设置初始配置
    instance.setOption(option, setOptionOpts);

    // Handle loading state
    // 处理加载状态
    if (showLoading) {
      instance.showLoading(loadingOption);
    } else {
      instance.hideLoading();
    }

    // Bind events
    // 绑定事件
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
  }, [shouldInit, initChart, option, setOptionOpts, showLoading, loadingOption, onEvents]);

  /**
   * Handle group changes
   * 处理组变化
   */
  useEffect(() => {
    const instance = getInstance();
    if (!instance) return;

    updateGroup(instance, prevGroupRef.current, group);
    prevGroupRef.current = group;
  }, [getInstance, group]);

  /**
   * Setup resize observer
   * 设置 resize 观察器
   */
  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    let resizeObserver: ResizeObserver | undefined;

    try {
      resizeObserver = new ResizeObserver(() => {
        // Look up current instance dynamically instead of capturing in closure
        // 动态查找当前实例而不是在闭包中捕获
        const currentInstance = getCachedInstance(element);
        currentInstance?.resize();
      });
      resizeObserver.observe(element);
    } catch (error) {
      // ResizeObserver might not be available in test environment
      // ResizeObserver 在测试环境中可能不可用
      console.warn("ResizeObserver not available:", error);
    }

    return () => {
      resizeObserver?.disconnect();
    };
  }, [ref]);

  /**
   * Cleanup on unmount or when element changes
   * 卸载时或元素改变时清理
   */
  useEffect(() => {
    // Copy ref.current to a variable to avoid stale closure issues
    // 复制 ref.current 到变量以避免闭包过时问题
    const element = ref.current;

    return () => {
      if (!element) return;

      const instance = getCachedInstance(element);
      if (!instance) return;

      // Remove from group if in one
      // 如果在组中，从组中移除
      const currentGroup = prevGroupRef.current;
      if (currentGroup) {
        updateGroup(instance, currentGroup, undefined);
      }

      // Unbind events
      // 解绑事件
      if (onEvents) {
        Object.entries(onEvents).forEach(([eventName, { handler }]) => {
          instance.off(eventName, handler);
        });
      }

      // Release cached instance
      // 释放缓存实例
      releaseCachedInstance(element);
    };
  }, [ref, onEvents]);

  return {
    setOption,
    getInstance,
    resize,
  };
}

export default useEcharts;
