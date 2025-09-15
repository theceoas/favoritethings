'use client'

import { useEffect } from 'react'
import { getSafariPerformanceMonitor } from '@/lib/utils/safari-performance-monitor'

export default function SafariMonitorInit() {
  useEffect(() => {
    try {
      const monitor = getSafariPerformanceMonitor()
      if (monitor && monitor.isSafariDetected()) {
        monitor.applyOptimizations()
      }
    } catch (error) {
      console.warn('Safari monitor failed to initialize:', error)
    }
  }, [])

  return null
}