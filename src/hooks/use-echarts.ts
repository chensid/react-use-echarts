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
import { isBuiltinTheme, getOrRegisterCustomTheme } from "../themes";

/**
 * Get theme name for ECharts initialization
 * 获取用于 ECharts 初始化的主题名称
 * @param theme Theme configuration
 * @returns Theme name string or null
 */
function resolveThemeName(theme: BuiltinTheme | object | null | undefined): string | object | null {
  if (theme === null || theme === undefined) {
    return null;
  } else if (typeof theme === 'string' && isBuiltinTheme(theme)) {
    return theme;
  } else if (typeof theme === 'object') {
    // Use cached theme registration to prevent memory leaks
    // 使用缓存的主题注册以防止内存泄漏
    return getOrRegisterCustomTheme(theme);
  }
  return null;
}

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
  
  // Track bound events for proper cleanup without dependency issues
  // 跟踪已绑定的事件，以便在不产生依赖问题的情况下正确清理
  const onEventsRef = useRef(onEvents);
  
  // Track if initial setup has been done
  // 跟踪是否已完成初始设置
  const isInitializedRef = useRef(false);

  // Update onEventsRef when onEvents changes
  // 当 onEvents 改变时更新 onEventsRef
  useEffect(() => {
    onEventsRef.current = onEvents;
  }, [onEvents]);

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
      // Create new instance
      // 创建新实例
      const themeToUse = resolveThemeName(theme);
      instance = echarts.init(element, themeToUse, { renderer });

      // Cache the instance
      // 缓存实例
      setCachedInstance(element, instance);

      // Store current theme for comparison
      // 存储当前主题用于比较
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
   * Initial setup when shouldInit becomes true (runs only once)
   * 当 shouldInit 变为 true 时进行初始设置（仅运行一次）
   */
  useLayoutEffect(() => {
    if (!shouldInit || isInitializedRef.current) return;

    const instance = initChart();
    if (!instance) return;

    // Mark as initialized
    // 标记为已初始化
    isInitializedRef.current = true;

    // Set initial options
    // 设置初始配置
    instance.setOption(option, setOptionOpts);

    // Handle loading state
    // 处理加载状态
    if (showLoading) {
      instance.showLoading(loadingOption);
    }

    // Bind initial events
    // 绑定初始事件
    const currentOnEvents = onEventsRef.current;
    if (currentOnEvents) {
      Object.entries(currentOnEvents).forEach(
        ([eventName, { handler, query, context }]) => {
          if (query) {
            instance.on(eventName, query, handler, context);
          } else {
            instance.on(eventName, handler, context);
          }
        }
      );
    }
  }, [shouldInit, initChart, option, setOptionOpts, showLoading, loadingOption]);

  /**
   * Handle option updates after initialization
   * 初始化后处理配置更新
   */
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const instance = getInstance();
    if (!instance) return;

    instance.setOption(option, setOptionOpts);
  }, [getInstance, option, setOptionOpts]);

  /**
   * Handle theme changes after initialization
   * 初始化后处理主题变化
   */
  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    const element = ref.current;
    if (!element) return;

    // Check if theme changed
    // 检查主题是否改变
    if (prevThemeRef.current === theme) return;

    const existingInstance = getCachedInstance(element);
    if (!existingInstance) return;

    // Theme changed, need to recreate instance
    // replaceCachedInstance will dispose the old instance
    // 主题改变，需要重新创建实例
    // replaceCachedInstance 会销毁旧实例
    const themeToUse = resolveThemeName(theme);
    const newInstance = echarts.init(element, themeToUse, { renderer });
    replaceCachedInstance(element, newInstance);
    prevThemeRef.current = theme;

    // Re-apply current options to new instance
    // 将当前配置重新应用到新实例
    newInstance.setOption(option, setOptionOpts);

    // Re-bind events to new instance
    // 将事件重新绑定到新实例
    const currentOnEvents = onEventsRef.current;
    if (currentOnEvents) {
      Object.entries(currentOnEvents).forEach(
        ([eventName, { handler, query, context }]) => {
          if (query) {
            newInstance.on(eventName, query, handler, context);
          } else {
            newInstance.on(eventName, handler, context);
          }
        }
      );
    }
  }, [ref, theme, renderer, option, setOptionOpts]);

  /**
   * Handle loading state changes
   * 处理加载状态变化
   */
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const instance = getInstance();
    if (!instance) return;

    if (showLoading) {
      instance.showLoading(loadingOption);
    } else {
      instance.hideLoading();
    }
  }, [getInstance, showLoading, loadingOption]);

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

      // Unbind events using ref to avoid dependency issues
      // 使用 ref 解绑事件以避免依赖问题
      const currentOnEvents = onEventsRef.current;
      if (currentOnEvents) {
        Object.entries(currentOnEvents).forEach(([eventName, { handler }]) => {
          instance.off(eventName, handler);
        });
      }

      // Release cached instance
      // 释放缓存实例
      releaseCachedInstance(element);
    };
  }, [ref]);

  return {
    setOption,
    getInstance,
    resize,
  };
}

export default useEcharts;
