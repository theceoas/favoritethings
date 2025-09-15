'use client'

// Safari Performance Monitor
// Tracks performance issues specific to Safari and provides fallbacks

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage?: number
  connectionType?: string
  isSlowDevice: boolean
  safariVersion?: string
}

interface SafariIssue {
  type: 'performance' | 'compatibility' | 'error'
  message: string
  timestamp: number
  userAgent: string
  url: string
  stack?: string
}

class SafariPerformanceMonitor {
  private issues: SafariIssue[] = []
  private metrics: PerformanceMetrics | null = null
  private isSafari: boolean = false
  private safariVersion: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.detectSafari()
      this.initializeMonitoring()
    }
  }

  private detectSafari(): void {
    const userAgent = navigator.userAgent
    this.isSafari = /^((?!chrome|android).)*safari/i.test(userAgent)
    
    if (this.isSafari) {
      const match = userAgent.match(/Version\/(\d+\.\d+)/)
      this.safariVersion = match ? match[1] : null
    }
  }

  private initializeMonitoring(): void {
    if (!this.isSafari) return

    // Monitor page load performance
    window.addEventListener('load', () => {
      this.measurePerformance()
    })

    // Monitor errors
    window.addEventListener('error', (event) => {
      this.logIssue({
        type: 'error',
        message: event.message,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        stack: event.error?.stack
      })
    })

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logIssue({
        type: 'error',
        message: `Unhandled promise rejection: ${event.reason}`,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    })

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      setInterval(() => {
        this.checkMemoryUsage()
      }, 30000) // Check every 30 seconds
    }
  }

  private measurePerformance(): void {
    if (!this.isSafari) return

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const loadTime = navigation.loadEventEnd - navigation.fetchStart
    const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart

    // Check connection type
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    const connectionType = connection?.effectiveType || 'unknown'

    // Detect slow device based on performance
    const isSlowDevice = loadTime > 3000 || renderTime > 1000

    this.metrics = {
      loadTime,
      renderTime,
      connectionType,
      isSlowDevice,
      safariVersion: this.safariVersion || undefined
    }

    // Log performance issues
    if (loadTime > 5000) {
      this.logIssue({
        type: 'performance',
        message: `Slow page load detected: ${loadTime}ms`,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }

    if (renderTime > 2000) {
      this.logIssue({
        type: 'performance',
        message: `Slow DOM rendering detected: ${renderTime}ms`,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }
  }

  private checkMemoryUsage(): void {
    if (!this.isSafari || !('memory' in performance)) return

    const memory = (performance as any).memory
    const usedMemory = memory.usedJSHeapSize
    const totalMemory = memory.totalJSHeapSize
    const memoryUsagePercent = (usedMemory / totalMemory) * 100

    if (this.metrics) {
      this.metrics.memoryUsage = memoryUsagePercent
    }

    // Log high memory usage
    if (memoryUsagePercent > 80) {
      this.logIssue({
        type: 'performance',
        message: `High memory usage detected: ${memoryUsagePercent.toFixed(1)}%`,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }
  }

  private logIssue(issue: SafariIssue): void {
    this.issues.push(issue)
    
    // Keep only last 50 issues to prevent memory leaks
    if (this.issues.length > 50) {
      this.issues = this.issues.slice(-50)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Safari Issue Detected:', issue)
    }

    // Send to analytics in production (optional)
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      this.sendToAnalytics(issue)
    }
  }

  private sendToAnalytics(issue: SafariIssue): void {
    // Send to your analytics service
    // This is a placeholder - implement based on your analytics provider
    try {
      const gtag = (window as any).gtag
      if (typeof gtag !== 'undefined') {
        gtag('event', 'safari_issue', {
          event_category: 'Performance',
          event_label: issue.type,
          value: 1,
          custom_parameters: {
            message: issue.message,
            safari_version: this.safariVersion,
            url: issue.url
          }
        })
      }
    } catch (error) {
      // Silently fail analytics
    }
  }

  // Public methods
  public getMetrics(): PerformanceMetrics | null {
    return this.metrics
  }

  public getIssues(): SafariIssue[] {
    return [...this.issues]
  }

  public isSafariDetected(): boolean {
    return this.isSafari
  }

  public getSafariVersion(): string | null {
    return this.safariVersion
  }

  public isSlowDevice(): boolean {
    return this.metrics?.isSlowDevice || false
  }

  public shouldReduceAnimations(): boolean {
    if (!this.isSafari) return false
    
    // Reduce animations for:
    // - Slow devices
    // - Old Safari versions
    // - Slow connections
    const isOldSafari = this.safariVersion && parseFloat(this.safariVersion) < 14
    const isSlowConnection = this.metrics?.connectionType === 'slow-2g' || this.metrics?.connectionType === '2g'
    
    return this.isSlowDevice() || isOldSafari || isSlowConnection || false
  }

  public applyOptimizations(): void {
    if (!this.isSafari) return

    // Apply CSS optimizations for Safari
    const style = document.createElement('style')
    style.textContent = `
      /* Safari-specific optimizations */
      * {
        -webkit-transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        -webkit-perspective: 1000;
      }
      
      /* Reduce animations for slow devices */
      ${this.shouldReduceAnimations() ? `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      ` : ''}
      
      /* Optimize scrolling */
      body {
        -webkit-overflow-scrolling: touch;
      }
    `
    document.head.appendChild(style)
  }
}

// Singleton instance
let safariMonitor: SafariPerformanceMonitor | null = null

export function getSafariPerformanceMonitor(): SafariPerformanceMonitor {
  if (!safariMonitor && typeof window !== 'undefined') {
    safariMonitor = new SafariPerformanceMonitor()
  }
  return safariMonitor!
}

export function useSafariPerformanceMonitor() {
  const monitor = getSafariPerformanceMonitor()
  
  return {
    isSafari: monitor?.isSafariDetected() || false,
    safariVersion: monitor?.getSafariVersion(),
    metrics: monitor?.getMetrics(),
    issues: monitor?.getIssues() || [],
    isSlowDevice: monitor?.isSlowDevice() || false,
    shouldReduceAnimations: monitor?.shouldReduceAnimations() || false,
    applyOptimizations: () => monitor?.applyOptimizations()
  }
}

export type { PerformanceMetrics, SafariIssue }