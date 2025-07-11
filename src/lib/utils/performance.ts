/**
 * Performance monitoring and optimization utilities
 */

import React from 'react';

// Performance metrics collection
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.startTime);
            this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.startTime);
            this.recordMetric('first_paint', navEntry.responseEnd - navEntry.startTime);
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (error) {
      console.warn('Navigation timing observer not supported:', error);
    }

    // Observe resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric(`resource_${resourceEntry.initiatorType}`, resourceEntry.duration);
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Resource timing observer not supported:', error);
    }

    // Observe largest contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('largest_contentful_paint', entry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn('LCP observer not supported:', error);
    }

    // Observe first input delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('first_input_delay', (entry as unknown as { processingStart: number }).processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      console.warn('FID observer not supported:', error);
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    // Keep only last 100 measurements
    const values = this.metrics.get(name)!;
    if (values.length > 100) {
      values.shift();
    }

    // Log significant performance issues
    if (name === 'page_load_time' && value > 3000) {
      console.warn(`Slow page load detected: ${value}ms`);
    }
    if (name === 'largest_contentful_paint' && value > 2500) {
      console.warn(`Poor LCP detected: ${value}ms`);
    }
    if (name === 'first_input_delay' && value > 100) {
      console.warn(`Poor FID detected: ${value}ms`);
    }
  }

  getMetrics(name: string): number[] {
    return this.metrics.get(name) || [];
  }

  getAverageMetric(name: string): number {
    const values = this.getMetrics(name);
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  getAllMetrics(): Record<string, { average: number; count: number; latest: number }> {
    const result: Record<string, { average: number; count: number; latest: number }> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      result[name] = {
        average: this.getAverageMetric(name),
        count: values.length,
        latest: values[values.length - 1] || 0,
      };
    }
    
    return result;
  }

  clearMetrics() {
    this.metrics.clear();
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Performance timing utilities
export const performanceUtils = {
  // Measure function execution time
  measureAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      PerformanceMonitor.getInstance().recordMetric(`function_${name}`, duration);
      
      if (duration > 1000) {
        console.warn(`Slow function execution: ${name} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      PerformanceMonitor.getInstance().recordMetric(`function_${name}_error`, duration);
      throw error;
    }
  },

  measure: <T>(name: string, fn: () => T): T => {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      PerformanceMonitor.getInstance().recordMetric(`function_${name}`, duration);
      
      if (duration > 100) {
        console.warn(`Slow synchronous function: ${name} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      PerformanceMonitor.getInstance().recordMetric(`function_${name}_error`, duration);
      throw error;
    }
  },

  // Mark custom performance events
  mark: (name: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(name);
    }
  },

  // Measure between two marks
  measureBetween: (name: string, startMark: string, endMark: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        if (measure) {
          PerformanceMonitor.getInstance().recordMetric(name, measure.duration);
        }
      } catch (error) {
        console.warn(`Failed to measure between marks: ${error}`);
      }
    }
  },

  // Get Core Web Vitals
  getCoreWebVitals: (): Promise<{
    lcp?: number;
    fid?: number;
    cls?: number;
  }> => {
    return new Promise((resolve) => {
      const vitals: { lcp?: number; fid?: number; cls?: number } = {};

      // Set a timeout to resolve even if not all metrics are available
      const resolveTimeout = setTimeout(() => resolve(vitals), 5000);

      // LCP
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
          lcpObserver.disconnect();
          
          if (vitals.lcp && vitals.fid !== undefined && vitals.cls !== undefined) {
            clearTimeout(resolveTimeout);
            resolve(vitals);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch {
        console.warn('LCP measurement not supported');
      }

      // FID
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstEntry = entries[0];
          vitals.fid = (firstEntry as unknown as { processingStart: number }).processingStart - firstEntry.startTime;
          fidObserver.disconnect();
          
          if (vitals.lcp && vitals.fid !== undefined && vitals.cls !== undefined) {
            clearTimeout(resolveTimeout);
            resolve(vitals);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch {
        console.warn('FID measurement not supported');
        vitals.fid = 0; // Set to 0 if not supported
      }

      // CLS
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as unknown as { hadRecentInput?: boolean }).hadRecentInput) {
              clsValue += (entry as unknown as { value: number }).value;
            }
          }
          vitals.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        
        // CLS is measured over time, so we'll set it after a delay
        setTimeout(() => {
          clsObserver.disconnect();
          if (vitals.lcp && vitals.fid !== undefined && vitals.cls !== undefined) {
            clearTimeout(resolveTimeout);
            resolve(vitals);
          }
        }, 3000);
      } catch {
        console.warn('CLS measurement not supported');
        vitals.cls = 0; // Set to 0 if not supported
      }
    });
  },
};

// React hooks for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    recordMetric: monitor.recordMetric.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    getAverageMetric: monitor.getAverageMetric.bind(monitor),
    getAllMetrics: monitor.getAllMetrics.bind(monitor),
  };
}

// HOC for measuring component render time
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const name = componentName || Component.displayName || Component.name || 'Unknown';
  
  const WrappedComponent = (props: P) => {
    const renderStart = performance.now();
    
    React.useEffect(() => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      PerformanceMonitor.getInstance().recordMetric(`component_render_${name}`, renderTime);
      
      if (renderTime > 16) { // More than one frame at 60fps
        console.warn(`Slow component render: ${name} took ${renderTime}ms`);
      }
    });
    
    return React.createElement(Component, props);
  };
  
  WrappedComponent.displayName = `withPerformanceMonitoring(${name})`;
  return WrappedComponent;
}

// Bundle size analyzer
export const bundleAnalyzer = {
  logBundleSize: () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.name.includes('.js'));
      const cssResources = resources.filter(r => r.name.includes('.css'));
      
      const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const totalCSSSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      
      console.group('Bundle Analysis');
      console.log(`Total JS Size: ${(totalJSSize / 1024).toFixed(2)} KB`);
      console.log(`Total CSS Size: ${(totalCSSSize / 1024).toFixed(2)} KB`);
      console.log(`Total Resources: ${resources.length}`);
      console.groupEnd();
      
      if (totalJSSize > 500 * 1024) { // 500KB
        console.warn('Large JavaScript bundle detected. Consider code splitting.');
      }
    }
  },
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Auto-initialize performance monitoring
  PerformanceMonitor.getInstance();
  
  // Log bundle size after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      bundleAnalyzer.logBundleSize();
    }, 1000);
  });
}
