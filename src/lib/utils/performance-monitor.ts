const isDevelopment = process.env.NODE_ENV === 'development'

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private timers: Map<string, number> = new Map()

  startTimer(name: string): void {
    if (!isDevelopment) return
    this.timers.set(name, performance.now())
  }

  endTimer(name: string): number | undefined {
    if (!isDevelopment) return
    
    const startTime = this.timers.get(name)
    if (!startTime) {
      console.warn(`No timer found for: ${name}`)
      return
    }

    const duration = performance.now() - startTime
    this.timers.delete(name)
    
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now()
    })

    // Warn about slow operations
    if (duration > 100) {
      console.warn(`🐌 Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  getMetrics(): PerformanceMetric[] {
    return this.metrics
  }

  getSlowOperations(threshold: number = 100): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.duration > threshold)
  }

  clearMetrics(): void {
    this.metrics = []
  }

  // Monitor component render times
  monitorComponent<T extends object>(
    Component: React.ComponentType<T>, 
    componentName: string
  ): React.ComponentType<T> {
    if (!isDevelopment) return Component

    return (props: T) => {
      const renderStart = performance.now()
      
      React.useEffect(() => {
        const renderTime = performance.now() - renderStart
        if (renderTime > 16) { // More than 1 frame at 60fps
          console.warn(`🎨 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`)
        }
      })

      return React.createElement(Component, props)
    }
  }

  // Monitor API calls
  monitorFetch(url: string, options?: RequestInit): Promise<Response> {
    const timerName = `API: ${url}`
    this.startTimer(timerName)

    return fetch(url, options)
      .then(response => {
        this.endTimer(timerName)
        return response
      })
      .catch(error => {
        this.endTimer(timerName)
        throw error
      })
  }

  // Monitor database queries
  monitorSupabaseQuery(queryName: string, queryPromise: Promise<any>): Promise<any> {
    const timerName = `DB: ${queryName}`
    this.startTimer(timerName)

    return queryPromise
      .then(result => {
        const duration = this.endTimer(timerName)
        if (duration && duration > 500) {
          console.warn(`🐌 Slow database query: ${queryName} took ${duration.toFixed(2)}ms`)
        }
        return result
      })
      .catch(error => {
        this.endTimer(timerName)
        throw error
      })
  }

  // Generate performance report
  generateReport(): string {
    const slowOps = this.getSlowOperations()
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length

    return `
🚀 Performance Report:
- Total operations: ${this.metrics.length}
- Average duration: ${avgDuration.toFixed(2)}ms
- Slow operations (>100ms): ${slowOps.length}
- Slowest operation: ${slowOps.length > 0 ? `${slowOps[0]?.name} (${slowOps[0]?.duration.toFixed(2)}ms)` : 'None'}

${slowOps.length > 0 ? '\n🐌 Slow Operations:\n' + slowOps.map(op => `- ${op.name}: ${op.duration.toFixed(2)}ms`).join('\n') : ''}
    `.trim()
  }
}

export const performanceMonitor = new PerformanceMonitor()

// React import for the monitor component function
import React from 'react' 